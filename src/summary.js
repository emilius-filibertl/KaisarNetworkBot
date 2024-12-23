import axios from "axios";
import chalk from "chalk";
import { HttpsProxyAgent } from "https-proxy-agent";

import { readProxy } from "./readConfig.js";

const { red } = chalk;

const retry = async (retryCount) => {
  console.log(
    red(`Wait 2.5 seconds before retrying... (Retry #${retryCount})\n`)
  );

  // Delay 2.5 second
  await new Promise((resolve) => setTimeout(resolve, 2500));
};

const pointSummary = async (userToken) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${userToken}`,
  };

  const { username, password, hostname, port } = await readProxy();

  const proxy = `http://${username}:${password}@${hostname}:${port}`;

  const proxyAgent = new HttpsProxyAgent(proxy);

  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await axios.get(
        "https://zero-api.kaisar.io/user/summary",
        {
          headers: headers,
          httpsAgent: proxyAgent,
        }
      );

      const { status, data } = response;

      if (status === 200) {
        const { total, today } = response.data.data;
        return { total, today };
      } else {
        // Error response 2xx
        console.log(red(`Error encountered during pointSummary:`));
        console.log(red(`Status: ${status}`));
        console.log(red(`Message: ${data?.message || "Unknown error"}`));

        await retry(++retryCount);
      }
    } catch (error) {
      // Error response 4xx and 5xx etc
      console.log(red(`Error encountered during ping:`));

      if (error.response) {
        const { status, data } = error.response;

        // Response from server, handle error response status
        if (status === 401 || status === 403) {
          console.log(red(`Authentication Error: ${status}`));
          console.log(red(`Please check your token or credentials.\n`));
          // Stop retrying after authentication error
          return;
        }

        console.log(red(`Status: ${status}`));
        console.log(red(`Message: ${data?.message || "Unknown error"}`));
      } else {
        // Network or unknown error
        console.log(red(`Network or unknown error: ${error.message}`));
      }

      await retry(++retryCount);
    }
  }

  console.log(red(`Max retries reached. Giving up :(\n`));
};

const convertToWIB = async (time) => {
  const date = new Date(time);
  const options = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const jakartaTime = date.toLocaleString("en-GB", options);
  const [day, month, year, hour, minute, second] = jakartaTime.split(/[\/\s:]/);
  return `${day}/${month}/${year} ${hour}:${minute}:${second} WIB`;
};

const nodeSummary = async (nodeId, nodeToken) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${nodeToken}`,
  };

  const { username, password, hostname, port } = await readProxy();

  const proxy = `http://${username}:${password}@${hostname}:${port}`;

  const proxyAgent = new HttpsProxyAgent(proxy);

  const maxRetries = 5;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await axios.get(
        `https://zero-api.kaisar.io/mining/current?extension=${nodeId}`,
        {
          headers: headers,
          httpsAgent: proxyAgent,
        }
      );

      const { status, data } = response;

      if (status === 200) {
        const { ip, start, end } = response.data.data;

        // Convert start and end times to WIB
        const startWIB = await convertToWIB(start);
        const endWIB = await convertToWIB(end);

        return { ip, startWIB, endWIB };
      } else {
        // Error response 2xx
        console.log(red(`Error encountered during nodeSummary:`));
        console.log(red(`Status: ${status}`));
        console.log(red(`Message: ${data?.message || "Unknown error"}`));

        await retry(++retryCount);
      }
    } catch (error) {
      // Error response 4xx and 5xx etc
      console.log(red(`Error encountered during nodeSummary:`));

      if (error.response) {
        const { status, data } = error.response;

        // Response from server, handle error response status
        if (status === 401 || status === 403) {
          console.log(red(`Authentication Error: ${status}`));
          console.log(red(`Please check your token or credentials.\n`));
          // Stop retrying after authentication error
          return;
        }

        console.log(red(`Status: ${status}`));
        console.log(red(`Message: ${data?.message || "Unknown error"}`));
      } else {
        // Network or unknown error
        console.log(red(`Network or unknown error: ${error.message}`));
      }

      await retry(++retryCount);
    }
  }

  console.log(red(`Max retries reached. Giving up :(\n`));
};

const summary = async (userToken, nodeId, nodeToken) => {
  // Fetch point summary
  const pointData = await pointSummary(userToken);

  if (pointData) {
    console.log(`Total: ${pointData.total}`);
    console.log(`Today: ${pointData.today}`);
  } else {
    console.log(red("Error: Point summary data.\n"));
    return;
  }

  // Fetch node summary
  const nodeData = await nodeSummary(nodeId, nodeToken);

  if (nodeData) {
    console.log(`Start: ${nodeData.startWIB}`);
    console.log(`End: ${nodeData.endWIB}`);
    console.log(`IP: ${nodeData.ip}\n`);
  } else {
    console.log(red("Error: Node summary data.\n"));
    return;
  }
};

export { summary };
