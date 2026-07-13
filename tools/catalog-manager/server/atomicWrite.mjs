import { writeFile, rename, rm } from "node:fs/promises";
export const atomicWriteJson = async (target, value) => {
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
};
