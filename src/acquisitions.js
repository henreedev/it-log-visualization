const rawData = `
Login	Thu 09/05/2024	15:19:41.29	jpien 	
Logoff	Thu 09/05/2024	16:42:22.29	jpien  
Login	Fri 09/27/2024	 9:22:53.10	adtirtos 	
Logoff	Fri 09/27/2024	 9:40:35.67	adtirtos  
Login	Fri 10/04/2024	16:41:06.19	anarsipu 	
Logoff	Fri 10/04/2024	18:00:07.47	anarsipu  
Login	Sat 10/05/2024	16:05:59.27	mgyee 	
Logoff	Sat 10/05/2024	17:39:42.70	mgyee  
Login	Mon 10/07/2024	18:06:03.54	abousque 	
Logoff	Mon 10/07/2024	19:05:22.33	abousque  
Login	Tue 10/08/2024	 9:33:43.75	rpankaj 	
Logoff	Tue 10/08/2024	10:29:54.10	rpankaj  
Login	Tue 10/08/2024	16:59:54.21	mbucci 	
Logoff	Tue 10/08/2024	17:09:59.91	mbucci  
Login	Wed 10/09/2024	10:45:05.64	jherbst1 	
Logoff	Wed 10/09/2024	11:01:27.73	jherbst1  
Login	Wed 10/09/2024	15:31:45.31	mbucci 	
Logoff	Wed 10/09/2024	17:58:15.50	mbucci  
Login	Thu 10/10/2024	17:17:25.17	rpankaj 	
Logoff	Thu 10/10/2024	19:59:42.96	rpankaj  
Login	Sat 10/12/2024	19:30:51.93	sgoel17 	
Logoff	Sat 10/12/2024	21:11:16.57	sgoel17  
Login	Tue 10/15/2024	17:58:06.36	anarsipu 	
Logoff	Tue 10/15/2024	20:44:18.98	anarsipu  
Login	Wed 10/16/2024	18:10:03.50	anarsipu 	
Logoff	Wed 10/16/2024	20:13:47.75	anarsipu  
Login	Thu 10/17/2024	14:20:46.06	ssamaha1 	
Logoff	Thu 10/17/2024	14:26:30.74	ssamaha1  
Login	Thu 10/17/2024	15:53:44.66	tcseidel 	
Logoff	Thu 10/17/2024	20:08:39.68	tcseidel  
Login	Fri 10/18/2024	11:20:36.71	anarsipu 	
Logoff	Fri 10/18/2024	11:54:45.02	anarsipu  
Login	Sun 10/20/2024	16:07:32.08	odheng 	
Logoff	Sun 10/20/2024	18:06:24.54	odheng  
Login	Mon 10/21/2024	16:34:05.70	nmodugul 	
Logoff	Mon 10/21/2024	20:17:41.72	nmodugul  
Login	Tue 10/22/2024	12:37:28.06	mbucci 	
Logoff	Tue 10/22/2024	14:17:21.83	mbucci  
Login	Tue 10/22/2024	16:22:34.95	pgupta27 	
Logoff	Tue 10/22/2024	16:44:23.53	pgupta27  
Login	Tue 10/22/2024	16:46:16.26	ssamaha1 	
Logoff	Tue 10/22/2024	17:49:49.95	ssamaha1  
Login	Tue 10/22/2024	18:10:27.84	nmodugul 	
Logoff	Tue 10/22/2024	18:31:29.64	nmodugul  
Login	Tue 10/22/2024	18:36:22.26	jjoneill 	
Logoff	Tue 10/22/2024	18:50:32.57	jjoneill  
Login	Tue 10/22/2024	19:01:42.51	mjayawee 	
Logoff	Tue 10/22/2024	20:04:49.76	mjayawee  
Login	Tue 10/22/2024	20:52:06.65	mjayawee 	
Logoff	Tue 10/22/2024	21:57:06.07	mjayawee  
Login	Wed 10/23/2024	14:12:21.83	mjayawee 	
Logoff	Wed 10/23/2024	15:31:40.86	mjayawee  
Login	Wed 10/23/2024	15:47:38.54	ssamaha1 	
Logoff	Wed 10/23/2024	16:09:36.01	ssamaha1  
Login	Wed 10/23/2024	17:03:38.27	mjayawee 	
Logoff	Wed 10/23/2024	17:15:40.39	mjayawee  
Login	Wed 10/23/2024	18:33:35.85	cmorenoa 	
Logoff	Wed 10/23/2024	20:00:56.36	cmorenoa  
Login	Thu 10/24/2024	11:46:10.51	anarsipu 	
Logoff	Thu 10/24/2024	11:58:55.11	anarsipu  
Login	Thu 10/24/2024	14:14:27.27	anarsipu 	
`;

// Split data by line and parse each entry
const events = rawData
  .trim()
  .split("\n")
  .map((line) => {
    const [action, , date, time] = line.trim().split(/\s+/);

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
    ).getTime();

    return { action, timestamp };
  });

console.log(events);

// Sort events by timestamp
events.sort((a, b) => a.timestamp - b.timestamp);

let concurrentUsers = 0;
const dataPoints = [];

// Track user count changes over time
events.forEach((event) => {
  concurrentUsers += event.action === "Login" ? 1 : -1;
  dataPoints.push({ time: event.timestamp, count: concurrentUsers });
  console.log(dataPoints);
});

// Format data for Chart.js
const chartData = {
  labels: dataPoints.map((point) => new Date(point.time).toLocaleString()),
  datasets: [
    {
      label: "Concurrent Users",
      data: dataPoints.map((point) => point.count),
      borderColor: "rgba(75, 192, 192, 1)",
      fill: false,
      tension: 0.1,
    },
  ],
};

(async function () {
  const data = [
    { year: 2010, count: 10 },
    { year: 2011, count: 20 },
    { year: 2012, count: 15 },
    { year: 2013, count: 25 },
    { year: 2014, count: 22 },
    { year: 2015, count: 30 },
    { year: 2016, count: 28 },
  ];

  new Chart(document.getElementById("acquisitions"), {
    type: "line",
    data: chartData,
    // options: {
    //   scales: {
    //     x: { type: "time", time: { unit: "quarter" } },
    //     y: { beginAtZero: true },
    //   },
    // },
  });
})();
