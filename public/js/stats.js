fetch(`/api/stats/`)
  .then(res => res.json())
  .then(stats => {
    console.log(stats);
    let statsDiv = document.getElementById("statsdiv");

    stats.users.forEach(user => {
      let newUserDiv = document.createElement("div");
      newUserDiv.setAttribute("id", `${user.username}`);
      newUserDiv.setAttribute("class", "d-flex flex-wrap border p-1 m-2");
      newUserDiv.innerHTML = `<div class="mr-2 border-right"><span><img class="m-1" style="height: 20px; width: 20px;" src="${user.profile_pic_url}"/></span><a class="mr-2" href="/user/${user.username}">${user.username}</a></div>`;
      statsDiv.append(newUserDiv);
    });

    stats.logs.forEach(log => {
      let userDiv = document.getElementById(`${log.user}`);
      let logSquare = document.createElement("div");
      logSquare.setAttribute("id", `${log.user}log${log._id}`);
      logSquare.setAttribute("style", "height: 20px; width: 20px;");
      logSquare.setAttribute("class", "bg-success m-1");
      userDiv.append(logSquare);
    });
  });
