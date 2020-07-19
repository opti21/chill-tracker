fetch(`/api/user-tasks/`)
  .then((res) => res.json())
  .then((tasks) => {
    tasks.forEach((task) => {
      let taskDiv = document.getElementById(`${task.username}task`);
      taskDiv.innerHTML = ` ${task.task}`;
    });
  });
