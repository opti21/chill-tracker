let globalUser = document.getElementById("pageInfo").getAttribute("data-user");

fetch(`/api/logs/${globalUser}`)
  .then(res => res.json())
  .then(dailyLogs => {
    console.log(dailyLogs);

    const logsTable = document.getElementById("logbody");

    dailyLogs.forEach(log => {
      let newLog = document.createElement("tr");
      newLog.innerHTML = `
        <td><a href="/log/${log.taskID}/${log.day}"> ${moment(log.createdAt).format(
        "L"
      )}</a></td>
        <td><a href="/log/${log.taskID}/${log.day}">${log.title}</a></td>
        <td>${log.text}</td>
      `;
      logsTable.append(newLog);
    });

    $(document).ready(function () {
      $("#logtable").DataTable({
        order: [[0, "desc"]]
      });
    });

  });
