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

const feed = document.querySelector('.feed');
let lastPage = 0;
let canLoadMore = true;

const loadFeed = (page = 0) => {
  fetch(`/api/feed/?page=${page}`)
    .then((res) => res.json())
    .then(({ logs }) => {
      if (logs.length === 0) {
        canLoadMore = false;
        return;
      }

      logs.forEach(log => {
        feed.innerHTML += `
          <div id="${log.user}day${log.day}" class="card mb-3 w-100">
            <div class="row no-gutters">
              <div class="col-md-4">
                <a data-fancybox="gallery" href="${log.proof}"
                  ><img
                    src="https://external-content.duckduckgo.com/iu/?u=${log.proof}"
                    class="card-img"
                    style="display: block; max-width: 100%; height: auto;"
                /></a>
              </div>
              <div class="col-md-8">
                <div class="card-body">
                  <h5 class="card-title">
                    Day ${log.day} of <span id="${log.user}task"></span>
                  </h5>
                  <span
                    ><a href="/user/${log.user}"
                      ><img
                        id="${log.user}pic"
                        src="/api/user-pic/${log.user}"
                        alt=""
                        style="height: 30px; width: 30px;"
                        class="rounded-circle" /></a></span
                  ><a class="ml-2" href="/user/${log.user}">${log.user}</a>
                  <p class="card-text mt-2">
                    ${log.text}
                  </p>
                  <p class="card-text">
                    Proof:
                    <a
                      href="${log.proof}"
                      target="_blank"
                      rel="noopener noreferrer"
                      >${log.proof}</a
                    >
                  </p>
                </div>
              </div>
            </div>
          </div>
        `;
      });
    });
};

loadFeed();

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight && canLoadMore) {
    lastPage++;
    loadFeed(lastPage);
  }
});

// Hide img tags if not linked to an image
document.addEventListener("DOMContentLoaded", function (event) {
  document.querySelectorAll("img").forEach(function (img) {
    img.onerror = function () {
      this.style.display = "none";
    };
  });
});
