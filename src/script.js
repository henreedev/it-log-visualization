// Function to select directory and process files
async function selectDirectory() {
	try {
	  // Prompt the user to select a directory
	  const directoryHandle = await window.showDirectoryPicker();
  
	  // Initialize grouped logs
	  groupedLogs = {};
	  for (const group of groups) {
		groupedLogs[group] = [];
	  }
	  groupedLogs['all'] = []; // For all groups combined
  
	  // Iterate over files in the directory
	  for await (const entry of directoryHandle.values()) {
		if (entry.kind === 'file') {
		  const fileHandle = entry;
		  const file = await fileHandle.getFile();
		  const filename = file.name;
  
		  // Check if the filename starts with any of the group prefixes
		  const group = groups.find(group => filename.startsWith(group));
		  if (group) {
			const content = await file.text();
			groupedLogs[group].push({ filename, content });
			groupedLogs['all'].push({ filename, content });
		  }
		}
	  }
  
	  // Update group selection dropdown
	  updateGroupSelect();
  
	  // Automatically visualize data
	  visualizeData();
  
	} catch (error) {
	  console.error("Error accessing directory:", error);
	  alert("Failed to access directory. Please try again.");
	}
  }
  
  // Function to update group selection dropdown
	function updateGroupSelect() {
		const groupSelect = document.getElementById('groupSelect');
		groupSelect.innerHTML = ''; // Clear existing options
	
		// Add "All Groups" option
		const allOption = document.createElement('option');
		allOption.value = 'all';
		allOption.textContent = 'All Groups';
		groupSelect.appendChild(allOption);
	
		for (const group of groups) {
		if (groupedLogs[group] && groupedLogs[group].length > 0) {
			const option = document.createElement('option');
			option.value = group;
			option.textContent = group;
			groupSelect.appendChild(option);
		}
	}
  }
  
  // Function to parse log entries
  function parseLogContent(content) {
	const lines = content.trim().split('\n');
	const events = [];
  
	for (const line of lines) {
	  // Ignore empty lines
	  if (line.trim() === '') continue;
  
	  // Split the line into components
	  const parts = line.trim().split(/\s+/);
	  if (parts.length < 5) {
		console.warn(`Invalid line format: ${line}`);
		continue;
	  }
  
	  const [action, dayOfWeek, dateStr, timeStr, username] = parts;
  
	  // Combine date and time, remove day of the week
	  const dateTimeStr = `${dateStr} ${timeStr}`;
  
	  // Parse date and time components
	  const [month, day, year] = dateStr.split('/');
	  const [hours, minutes, seconds] = timeStr.split(':');
	  const [sec, millisec = '0'] = seconds.split('.');
	  const timestamp = new Date(
		year, month - 1, day, hours, minutes, sec, millisec
	  );
  
	  if (isNaN(timestamp)) {
		console.warn(`Invalid date format in line: ${line}`);
		continue;
	  }
  
	  events.push({
		action: action.trim(),
		username: username.trim(),
		timestamp: timestamp
	  });
	}
  
	return events;
  }
  
  // Function to pair login and logoff events within a log file
  function pairLoginLogoffEventsPerFile(events) {
	const pairedSessions = [];
	let currentSession = null;
  
	// Sort events by timestamp
	events.sort((a, b) => a.timestamp - b.timestamp);
  
	for (let i = 0; i < events.length; i++) {
	  const event = events[i];
	  const action = event.action;
	  const timestamp = event.timestamp;
	  const username = event.username;
  
	  if (action === 'Login') {
		if (currentSession) {
		  // Previous login without a logoff
		  // Assume previous user logged off at this login time
		  pairedSessions.push({
			username: currentSession.username,
			loginTime: currentSession.loginTime,
			logoffTime: timestamp
		  });
		}
		// Start new session
		currentSession = {
		  username: username,
		  loginTime: timestamp
		};
	  } else if (action === 'Logoff') {
		if (currentSession) {
		  // Pair current session with this logoff
		  pairedSessions.push({
			username: currentSession.username,
			loginTime: currentSession.loginTime,
			logoffTime: timestamp
		  });
		  currentSession = null;
		} else {
		  // Logoff without a corresponding login
		  console.warn(`Logoff without corresponding login at ${timestamp} in log file`);
		}
	  }
	}
  
	// Handle any remaining unmatched login event
	if (currentSession) {
	  // No subsequent login or logoff in this file
	  // Do not generate a logoff at the end
	  console.warn(`Unmatched login at end of file for user ${currentSession.username} at ${currentSession.loginTime}`);
	}
  
	return pairedSessions;
  }
  // Function to filter sessions based on date range
function filterSessionsByDateRange(sessions) {
	const startDateStr = document.getElementById('startDate').value;
	const endDateStr = document.getElementById('endDate').value;
  
	let startDate = null;
	let endDate = null;
  
	if (startDateStr) {
	  startDate = new Date(startDateStr);
	}
  
	if (endDateStr) {
	  endDate = new Date(endDateStr);
	}
  
	if (!startDate && !endDate) {
	  // No date range selected, return all sessions
	  return sessions;
	}
  
	return sessions.filter(session => {
	  const sessionStart = session.loginTime;
	  const sessionEnd = session.logoffTime;
  
	  // Check if session overlaps with the date range
	  const overlaps =
		(!startDate || sessionEnd >= startDate) &&
		(!endDate || sessionStart <= endDate);
  
	  return overlaps;
	});
  }
// Predefined groups (same as before)
const groups = [
	"ENG-BDW", "ENG-BH095", "ENG-BH097", "ENG-BH114", "ENG-BH190",
	"ENG-BH194", "ENG-CLA", "ENG-CLB", "ENG-EL", "ENG-ERC", "ENG-MEDIA", "ENG-MM",
	"ENG-PL", "ENG-STUDIO", "ENG-SWR", "ENG-WM", "ENG-XRD", "IMNI", "pengaz"
  ];
  
  // Global variables
  let groupedLogs = {};
  let chart = null;
  
  // Event listeners (same as before)
  document.getElementById('selectDirectoryBtn').addEventListener('click', selectDirectory);
  document.getElementById('groupSelect').addEventListener('change', () => visualizeData());
  document.getElementById('startDate').addEventListener('change', () => visualizeData());
  document.getElementById('endDate').addEventListener('change', () => visualizeData());
  
  // Initialize date pickers using flatpickr (same as before)
  flatpickr("#startDate", { enableTime: true, dateFormat: "Y-m-d H:i" });
  flatpickr("#endDate", { enableTime: true, dateFormat: "Y-m-d H:i" });
  

  // Function to visualize data based on selected group and date range
  function visualizeData() {
	const groupName = document.getElementById('groupSelect').value;
  
	if (!groupedLogs[groupName] || groupedLogs[groupName].length === 0) {
	  console.error(`Group ${groupName} has no log files.`);
	  alert(`Group ${groupName} has no log files.`);
	  return;
	}
  
	let allSessions = [];
  
	// Process each log file (computer) separately
	for (const file of groupedLogs[groupName]) {
	  // Parse events for this log file
	  const events = parseLogContent(file.content);
	  if (events.length === 0) {
		continue;
	  }
  
	  // Pair login and logoff events within this log file
	  const sessions = pairLoginLogoffEventsPerFile(events);
	  allSessions = allSessions.concat(sessions);
	}
  
	if (allSessions.length === 0) {
	  alert(`No valid log entries found for group ${groupName}.`);
	  return;
	}
  
	// Filter sessions based on selected date range
	const filteredSessions = filterSessionsByDateRange(allSessions);
  
	if (filteredSessions.length === 0) {
	  alert('No sessions found within the selected date range.');
	  return;
	}
  
	// Generate and aggregate concurrent users data
	const concurrentUsersData = calculateAndAggregateConcurrentUsers(filteredSessions);
  
	// Prepare data for Chart.js
	const labels = concurrentUsersData.map(point => point.time);
	const data = concurrentUsersData.map(point => point.users);
  
	// Create or update the chart
	const ctx = document.getElementById('concurrentUsersChart').getContext('2d');
  
	if (chart) {
	  chart.destroy();
	}
  
	chart = new Chart(ctx, {
	  type: 'bar', // Bar chart
	  data: {
		labels: labels,
		datasets: [{
		  label: 'Average Concurrent Users per Hour',
		  data: data,
		  backgroundColor: 'rgba(54, 162, 235, 0.6)', // Set bar color
		  borderColor: 'rgba(54, 162, 235, 1)',
		  borderWidth: 1,
		  barThickness: 'flex', // Adjust bar thickness
		  maxBarThickness: 50 // Maximum bar thickness in pixels
		}]
	  },
	  options: {
		scales: {
		  x: {
			type: 'time',
			time: {
			  unit: 'hour', // Set time unit to 'hour' for hourly aggregation
			  tooltipFormat: 'MMM d, yyyy, h a',
			  displayFormats: {
				hour: 'MMM d, yyyy, h a'
			  }
			},
			title: {
			  display: true,
			  text: 'Time'
			}
		  },
		  y: {
			title: {
			  display: true,
			  text: 'Average Concurrent Users'
			},
			beginAtZero: true,
			ticks: {
			  precision: 0
			}
		  }
		},
		plugins: {
		  tooltip: {
			mode: 'index',
			intersect: false
		  }
		}
	  }
	});
  }
  // Function to calculate and aggregate concurrent users over time
  function calculateAndAggregateConcurrentUsers(sessions) {
	const timePoints = [];
  
	for (const session of sessions) {
	  timePoints.push({ time: session.loginTime, change: 1 });
	  timePoints.push({ time: session.logoffTime, change: -1 });
	}
  
	// Sort time points
	timePoints.sort((a, b) => a.time - b.time);
  
	// Calculate concurrent users at each time point
	let concurrentUsers = 0;
	const concurrentUsersOverTime = [];
  
	for (const point of timePoints) {
	  concurrentUsers += point.change;
	  concurrentUsersOverTime.push({ time: new Date(point.time), users: concurrentUsers });
	}
  
	// Aggregate data over hourly intervals
	const aggregatedData = {};
	for (const point of concurrentUsersOverTime) {
	  // Round time to the start of the hour
	  const time = new Date(point.time);
	  time.setMinutes(0, 0, 0);
  
	  const timeKey = time.getTime();
  
	  if (!aggregatedData[timeKey]) {
		aggregatedData[timeKey] = { time: new Date(timeKey), users: [], count: 0 };
	  }
  
	  aggregatedData[timeKey].users.push(point.users);
	  aggregatedData[timeKey].count += 1;
	}
  
	// Calculate average users for each hour
	const aggregatedArray = [];
	for (const key in aggregatedData) {
	  const item = aggregatedData[key];
	  const averageUsers = item.users.reduce((a, b) => a + b, 0) / item.count;
	  aggregatedArray.push({ time: item.time, users: averageUsers });
	}
  
	// Sort aggregated data by time
	aggregatedArray.sort((a, b) => a.time - b.time);
  
	return aggregatedArray;
  }
  