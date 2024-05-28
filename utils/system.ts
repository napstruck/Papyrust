const startTime = Date.now();
export const uptimeInSecond = () => Number((Date.now() - startTime) / 1000).toFixed(0);
