const groups = ["ENG-BDW", "ENG-BH095", "ENG-BH097", "ENG-BH114", "ENG-BH190", 
  "ENG-BH194", "ENG-CLA", "ENG-CLB", "ENG-EL", "ENG-ERC", "ENG-MEDIA", "ENG-MM",
  "ENG-PL", "ENG-STUDIO", "ENG-SWR", "ENG-WM", "ENG-XRD", "IMNI", "pengaz"]

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


async function selectDirectory() {
  try {
    // Prompt the user to select a directory
    const directoryHandle = await window.showDirectoryPicker();
    
    // Select the div to display file contents
    const fileListDiv = document.getElementById("fileList");
    fileListDiv.innerHTML = "<h2>Files and Contents:</h2>";

    // Loop through each file in the directory
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const fileContent = await file.text(); // Read file content as text
        
        // Create a new section for each file
        const fileSection = document.createElement("div");
        fileSection.style.border = "1px solid #ddd";
        fileSection.style.padding = "10px";
        fileSection.style.marginBottom = "10px";
        
        // File name
        const fileName = document.createElement("h3");
        fileName.textContent = `File: ${entry.name}`;
        fileSection.appendChild(fileName);

        // File content
        const fileContentParagraph = document.createElement("pre");
        fileContentParagraph.textContent = fileContent;
        fileSection.appendChild(fileContentParagraph);

        // Append file section to file list div
        fileListDiv.appendChild(fileSection);
      }
    }
  } catch (error) {
    console.error("Error accessing directory:", error);
  }
}