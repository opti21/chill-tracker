fetch(`/api/stats/`)
  .then(res => res.json())
  .then(stats => {
    console.log(stats);
    let statsDiv = document.getElementById("statsdiv");
    console.log(stats.users)

    stats.users.forEach(user => {
      let newUserDiv = document.createElement("div");
      newUserDiv.setAttribute("id", `${user.username}`);
      newUserDiv.setAttribute("class", "d-flex flex-wrap border p-1 m-2");
      newUserDiv.innerHTML = `<div class="mr-2 border-right"><span><img class="m-1" style="height: 20px; width: 20px;" src="${user.profile_pic_url}"/></span><a class="mr-2" href="/user/${user.username}">${user.username}</a></div>
      <div id="${user.username}-ph" class="badge badge-sm badge-primary text-white">User hasn't created a task yet</div>
      `;
      statsDiv.append(newUserDiv);
    });

    console.log(stats.tasks)
    stats.tasks.forEach(task => {
      let userDiv = document.getElementById(`${task.user}`);
      let placeholder = document.getElementById(`${task.user}-ph`)

      if (!userDiv) {
        return
      } else {
        if (!placeholder) {
          return
        } else {
          placeholder.remove()
        }

        task.days.forEach(day => {
          if (day.completed) {
            let logSquare = document.createElement("a");
            logSquare.setAttribute("href", `/log/${task.user}/${day.day}`)
            logSquare.setAttribute("id", `${task.user}day${day.day}`);
            logSquare.setAttribute("style", "height: 20px; width: 20px;");
            logSquare.setAttribute("class", "bg-success m-1");
            userDiv.append(logSquare);
          } else {
            let logSquare = document.createElement("div");
            logSquare.setAttribute("id", `${task.user}day${day.day}`);
            logSquare.setAttribute("style", "height: 20px; width: 20px;");
            logSquare.setAttribute("class", "bg-danger m-1");
            userDiv.append(logSquare);
          }

        })
      }
    });
  });
