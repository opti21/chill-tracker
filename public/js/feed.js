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

// Hide img tags if not linked to an image
document.addEventListener("DOMContentLoaded", function (event) {
  document.querySelectorAll("img").forEach(function (img) {
    img.onerror = function () {
      this.style.display = "none";
    };
  });
});
