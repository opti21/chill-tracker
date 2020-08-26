fetch(`/api/logs/`)
  .then(res => res.json())
  .then(dailyLogs => {
    console.log(dailyLogs);

    const logsTable = document.getElementById("logbody");

    dailyLogs.forEach(log => {
      let newLog = document.createElement("tr");
      newLog.innerHTML = `
        <td><a href="/log/${log._id}"> ${moment(log.createdAt).format(
        "L"
      )}</a></td>
        <td><a href="/log/${log._id}">${log.title}</a></td>
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
