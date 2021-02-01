const taskID = document.getElementById('taskInfo').getAttribute('data-task')
console.log(taskID)
fetch(`/api/task/${taskID}`)
  .then(res => res.json())
  .then(task => {

    const logsDiv = document.getElementById("logdiv");

    task.days.forEach(log => {
      let newLog = document.createElement("div");
      newLog.setAttribute("class", "list-group-item")
      let isEditable = moment(log.date).isBetween(moment().subtract(2, 'day'), moment())
      // console.log(moment.tz(log.date, "America/Chicago").format('YYYY-MM-DD'))
      console.log(isEditable)

      if (isEditable && log.completed === false) {
        newLog.innerHTML = `
      <h4>Day ${log.day} <span class="badge badge-danger">Not Completed</span><a href="/newlog/${taskID}/${log.day}" class="btn btn-primary btn-sm text-white ml-2"><i class="fas fa-pencil-alt"></i> Add Log</a></h4> 
      `;
      } else if (isEditable && log.completed === true) {
        newLog.innerHTML = `
      <h4>Day ${log.day} <span class="badge badge-success">Completed</span><a class="btn btn-info btn-sm text-white ml-2" href="/log/${taskID}/${log.day}"><i class="far fa-eye"></i> View log</a></h4>
      `;
      } else if (log.completed === true) {
        newLog.innerHTML = `
      <h4>Day ${log.day} <span class="badge badge-success">Completed</span><a class="btn btn-info btn-sm text-white ml-2" href="/log/${taskID}/${log.day}"><i class="far fa-eye"></i> View log</a></h4>
      `;
      } else {
        newLog.innerHTML = `
      <h4>Day ${log.day} <span class="badge badge-danger">Not Completed</span></h4>
      `;
      }
      logsDiv.append(newLog);
    });


  })
  .catch(err => {
    console.error(err)
  })
