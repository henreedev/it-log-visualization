const fs = require("node:fs");
const evGrp = {};
function printFile(file) {
  let d;
  try {
    const data = fs.readFileSync(file, "utf8");
    d = data
      .trim()
      .split("\n")
      .map((line) => {
        const [action, , date, time, user] = line.trim().split(/\s+/);

        // Parse date and time separately
        const [month, day, year] = date.split("/").map(Number);
        const [hour, minute, secondFraction] = time.split(":");
        const [second, fraction] = secondFraction.split(".");

        // Construct a Date object
        const timestamp = new Date(
          year,
          month - 1,
          day,
          hour,
          minute,
          second,
          fraction * 10
        );

        // console.log(action, timestamp);
        const dateStr = timestamp.toISOString().split("T")[0];
        if (!evGrp[dateStr]) evGrp[dateStr] = { login: 0, logoff: 0 };
        if (action === "Login") evGrp[dateStr].login += 1;
        else evGrp[dateStr].logoff += 1;
      });
  } catch (err) {
    console.error(err);
  }
  console.log(evGrp);
  return d;
}

printFile("../data/ENG-EL11A.log");
