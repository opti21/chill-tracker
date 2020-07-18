let globalUser = document.getElementById("pageInfo").getAttribute("data-user");

fetch(`/api/logs/${globalUser}`)
  .then((res) => res.json())
  .then((dailyLogs) => {
    console.log(dailyLogs);
    for (let i = 1; i < 31; i++) {
      let logsDiv = document.getElementById("logsdiv");
      let foundDay = dailyLogs.find((dailyLog) => dailyLog.day === i);
      let newLog = document.createElement("div");
      if (foundDay && foundDay.day === i) {
        newLog.setAttribute(
          "class",
          "m-1 p-1 bg-success text-white text-center"
        );
        newLog.setAttribute("style", "height: 100px; width: 100px;");
        newLog.innerHTML = `
              <div><h3>Day ${i}</h3></div>
                  <div>
                      <a href="/log/${foundDay.user}/${i}" class="text-white" style="font-size: 30px;"
                      ><i class="far fa-eye"></i></a>
              </div>
              `;
        logsDiv.append(newLog);
      } else {
        newLog.setAttribute(
          "class",
          "m-1 p-1 bg-danger text-white text-center"
        );
        newLog.setAttribute("style", "height: 100px; width: 100px;");
        newLog.innerHTML = `
            <div><h3>Day ${i}</h3></div>
            </div>
            `;
        logsDiv.append(newLog);
      }
    }
  });
