import fs from "fs/promises";
import path from "path";

const readAccounts = async () => {
  try {
    const data = await fs.readFile(
      path.resolve("./config/accounts.json"),
      "utf-8"
    );
    const accounts = JSON.parse(data);
    return accounts;
  } catch (error) {
    console.error("Error reading accounts data:", error);
    throw error;
  }
};

const readProxy = async () => {
  try {
    const data = await fs.readFile(
      path.resolve("./config/proxy.json"),
      "utf-8"
    );
    const proxy = JSON.parse(data);
    return proxy;
  } catch (error) {
    console.error("Error reading accounts data:", error);
    throw error;
  }
};

export { readAccounts, readProxy };
