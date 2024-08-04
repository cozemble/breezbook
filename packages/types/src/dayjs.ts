import dayjs from "dayjs";
import origUtc from "dayjs/plugin/utc.js";
dayjs.extend(origUtc);

export const utc = dayjs.utc
