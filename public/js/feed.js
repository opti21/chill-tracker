fetch(`/api/user-tasks/`)
  .then((res) => res.json())
  .then((tasks) => {
    tasks.forEach((task) => {
      if (task === null) return;
      let taskDiv = document.getElementById(`${task.username}task`);
      if (taskDiv === null) return;
      taskDiv.innerHTML = ` ${task.task}`;
    });
  });
