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
        const container = document.createElement('div');
        container.classList.add('card', 'mb-3', 'w-100');
        container.id = `${log.user}day${log.day}`;
        container.innerHTML = `
          <div class="row no-gutters">
            <div class="col-md-4">
              <a data-fancybox="gallery" class="gallery">
                <img
                  class="card-img"
                  style="display: block; max-width: 100%; height: auto;"
                />
              </a>
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <h5 class="card-title">
                  Day <span class="day"></span> of <span class="task"></span>
                </h5>
                <span>
                  <a class="user-img">
                    <img
                      alt=""
                      style="height: 30px; width: 30px;"
                      class="rounded-circle"
                    />
                  </a>
                </span>
                <a class="ml-2 user"></a>
                <p class="card-text mt-2 text"></p>
                <p class="card-text">
                  Proof:
                  <a
                    class="proof"
                    target="_blank"
                    rel="noopener noreferrer"
                  ></a>
                </p>
              </div>
            </div>
          </div>
        `;

        const gallery = container.querySelector('.gallery')
        const galleryImage = gallery.querySelector('img');
        const day = container.querySelector('.day');
        const task = container.querySelector('.task');
        const userImg = container.querySelector('.user-img');
        const userImage = userImg.querySelector('img');
        const user = container.querySelector('.user');
        const text = container.querySelector('.text');
        const proof = container.querySelector('.proof');

        gallery.href = log.proof;
        galleryImage.src = `https://external-content.duckduckgo.com/iu/?u=${log.proof}`;
        day.textContent = log.day;
        task.id = `${log.user}task`;
        task.textContent = log.task;
        userImg.href = `/user/${log.user}`;
        userImg.id = `${log.user}pic`;
        userImage.src = `/api/user-pic/${log.user}`;
        user.href = `/user/${log.user}`;
        user.textContent = log.user;
        text.textContent = log.text;
        proof.href = proof.textContent = log.proof;

        feed.appendChild(container);
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
