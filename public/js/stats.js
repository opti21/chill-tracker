fetch(`/api/stats/`)
  .then((res) => res.json())
  .then((stats) => {
    console.log(stats);
    let statsDiv = document.getElementById("statsdiv");

    stats.users.forEach((user) => {
      let newUserDiv = document.createElement("div");
      newUserDiv.setAttribute("id", `${user.username}`);
      newUserDiv.setAttribute("class", "d-flex flex-wrap border p-1 m-2");
      newUserDiv.innerHTML = `<div class="mr-2 border-right"><span><img class="m-1" style="height: 20px; width: 20px;" src="${user.profile_pic_url}"/></span><a class="mr-2" href="/user/${user.username}">${user.username}</a></div>`;
      statsDiv.append(newUserDiv);
      for (let i = 1; i < 31; i++) {
        let userDiv = document.getElementById(`${user.username}`);
        let logSquare = document.createElement("a");
        logSquare.setAttribute("id", `${user.username}day${i}`);
        logSquare.setAttribute("style", "height: 20px; width: 20px;");
        logSquare.setAttribute("class", "bg-danger m-1");
        userDiv.append(logSquare);
      }
    });

    stats.logs.forEach((log) => {
      let logDiv = document.getElementById(`${log.user}day${log.day}`);
      logDiv.setAttribute("class", "bg-success m-1");
    });
  });
