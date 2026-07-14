import { access, rename, rm, writeFile } from "node:fs/promises";

const exists = async (file) => access(file).then(() => true).catch(() => false);

export const atomicWriteJson = async (target, value) => {
  const stamp = `${process.pid}.${Date.now()}`;
  const temp = `${target}.${stamp}.tmp`;
  const rollback = `${target}.${stamp}.rollback`;
  let movedOriginal = false;
  let installed = false;
  let preserveRollback = false;

  try {
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    if (await exists(target)) {
      await rename(target, rollback);
      movedOriginal = true;
    }
    await rename(temp, target);
    installed = true;
    if (movedOriginal) await rm(rollback, { force: true });
  } catch (error) {
    const recoveryErrors = [];
    if (installed) await rm(target, { force: true }).catch((recoveryError) => recoveryErrors.push(recoveryError));
    if (movedOriginal && await exists(rollback)) {
      await rename(rollback, target).catch((recoveryError) => recoveryErrors.push(recoveryError));
    }
    if (recoveryErrors.length) {
      preserveRollback = true;
      throw new AggregateError([error, ...recoveryErrors], `Penulisan gagal dan pemulihan otomatis tidak lengkap. File rollback dipertahankan: ${rollback}`);
    }
    throw error;
  } finally {
    await rm(temp, { force: true }).catch(() => {});
    if (!preserveRollback) await rm(rollback, { force: true }).catch(() => {});
  }
};

export const atomicReplaceJsonFiles = async (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return;

  const stamp = `${process.pid}.${Date.now()}`;
  const states = entries.map(({ target, value }, index) => ({
    target,
    value,
    temp: `${target}.${stamp}.${index}.tmp`,
    rollback: `${target}.${stamp}.${index}.rollback`,
    hadOriginal: false,
    installed: false,
  }));
  let preserveRollbacks = false;

  try {
    await Promise.all(states.map((state) => writeFile(
      state.temp,
      `${JSON.stringify(state.value, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    )));

    for (const state of states) {
      state.hadOriginal = await exists(state.target);
      if (state.hadOriginal) await rename(state.target, state.rollback);
    }

    for (const state of states) {
      await rename(state.temp, state.target);
      state.installed = true;
    }

    await Promise.all(states.map((state) => rm(state.rollback, { force: true })));
  } catch (error) {
    const recoveryErrors = [];
    for (const state of [...states].reverse()) {
      if (state.installed) await rm(state.target, { force: true }).catch((recoveryError) => recoveryErrors.push(recoveryError));
      if (state.hadOriginal && await exists(state.rollback)) {
        await rename(state.rollback, state.target).catch((recoveryError) => recoveryErrors.push(recoveryError));
      }
    }
    if (recoveryErrors.length) {
      preserveRollbacks = true;
      throw new AggregateError(
        [error, ...recoveryErrors],
        `Transaksi file gagal dan pemulihan otomatis tidak lengkap. File .rollback dipertahankan untuk recovery manual.`,
      );
    }
    throw error;
  } finally {
    await Promise.all(states.map((state) => rm(state.temp, { force: true }).catch(() => {})));
    if (!preserveRollbacks) await Promise.all(states.map((state) => rm(state.rollback, { force: true }).catch(() => {})));
  }
};
