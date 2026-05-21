$(function () {
  let tasks = JSON.parse(localStorage.getItem("nf_tasks") || "[]");

  function save() {
    localStorage.setItem("nf_tasks", JSON.stringify(tasks));
  }

  function makeId() {
    return "task_" + Date.now();
  }

  let currentTheme = localStorage.getItem("nf_theme") || "dark";
  let currentCard = null;
  let currentSection = "tasks";
  let sidebarOpen = false;
  let selected = new Set();
  let currentEditId = null;
  let activeColorPopup = null;

  // APPLY SAVED THEME
  if (currentTheme === "light") {
    $("body").addClass("light-mode");

    $("#theme-toggle i").removeClass("bi-sun-fill").addClass("bi-moon-fill");
  }
  // THEME TOGGLE
  $("#theme-toggle").on("click", function () {
    $("body").toggleClass("light-mode");

    const isLight = $("body").hasClass("light-mode");

    if (isLight) {
      currentTheme = "light";

      $("#theme-toggle i").removeClass("bi-sun-fill").addClass("bi-moon-fill");
    } else {
      currentTheme = "dark";

      $("#theme-toggle i").removeClass("bi-moon-fill").addClass("bi-sun-fill");
    }

    localStorage.setItem("nf_theme", currentTheme);
  });

  // Load Card
  function render() {
    const active = tasks.filter((t) => !t.archived && !t.deleted);
    const pinned = active.filter((t) => t.pinned);
    const unPinned = active.filter((t) => !t.pinned);
    const archive = tasks.filter((t) => t.archived);
    const bin = tasks.filter((t) => t.deleted);

    // Counts
    $("#cnt-tasks").text(active.length || "");
    $("#cnt-archive").text(archive.length || "");
    $("#cnt-bin").text(bin.length || "");

    $("#sb-cnt-tasks").text(active.length || "");
    $("#sb-cnt-archive").text(archive.length || "");
    $("#sb-cnt-bin").text(bin.length || "");

    // Render pinned tasks
    $("#pinned-grid").html(pinned.map(cardHTML).join(""));

    // Render normal tasks
    $("#tasks-grid").html(unPinned.map(cardHTML).join(""));

    // Archive & Bin
    $("#archive-grid").html(archive.map(cardHTML).join(""));
    $("#bin-grid").html(bin.map(cardHTML).join(""));

    // Empty states
    if (active.length === 0) {
      $("#tasks-empty").show();
    } else {
      $("#tasks-empty").hide();
    }

    if (archive.length === 0) {
      $("#archive-empty").show();
    } else {
      $("#archive-empty").hide();
    }

    if (bin.length === 0) {
      $("#bin-empty").show();
    } else {
      $("#bin-empty").hide();
    }

    // Hide pinned section if empty
    if (pinned.length === 0) {
      $("#pinned-section").hide();
    } else {
      $("#pinned-section").show();
    }

    updateSelectUI();
  }

  // SIDEBAR
  function openSidebar() {
    sidebarOpen = true;
    $("#sidebar").addClass("open");
    $("#main").addClass("sidebar-open");

    // MOBILE OVERLAY
    if (window.innerWidth <= 768) {
      $("body").addClass("sidebar-mobile-open");
    }
  }
  function closeSidebar() {
    sidebarOpen = false;
    $("#sidebar").removeClass("open");
    $("#main").removeClass("sidebar-open");

    $("body").removeClass("sidebar-mobile-open");
  }
  $("#toggle-sidebar").on("click", function () {
    sidebarOpen ? closeSidebar() : openSidebar();
  });

  // NAVIGATION
  function switchSection(sec) {
    currentSection = sec;

    selected.clear();
    updateSelectUI();

    $(".section").removeClass("active");
    $(`#section-${sec}`).addClass("active");

    $(".nav-tab-btn").removeClass("active");
    $(`.nav-tab-btn[data-section="${sec}"]`).addClass("active");

    $(".sidebar-btn").removeClass("active");
    $(`.sidebar-btn[data-section="${sec}"]`).addClass("active");
  }

  $(document).on("click", ".nav-tab-btn", function () {
    switchSection($(this).data("section"));
    closeSidebar();
  });
  $(document).on("click", ".sidebar-btn", function () {
    switchSection($(this).data("section"));
    closeSidebar();
  });

  // Create Card
  function cardHTML(task) {
    return `
      <div class="task-card ${task.color || ""} ${task.pinned ? "pinned" : ""}" data-id="${task.id}">
        <div class="card-select-check" data-id="${task.id}">
          <i class="bi bi-check"></i>
        </div>
        ${
          task.pinned
            ? `
            <div class="pin-indicator">
              <i class="bi bi-pin-fill"></i>
            </div>
          `
            : ""
        } 
        <div class="card-body-text">
          ${task.text}
        </div>

        <div class="card-actions">
        ${
          !task.archived && !task.deleted
            ? `
            <button class="card-btn pin-btn" data-id="${task.id}">
              <i class="bi bi-pin"></i>
            </button>
          `
            : ""
        }
        ${
          !task.archived && !task.deleted
            ? `
            <button class="card-btn color-btn" data-id="${task.id}">
              <i class="bi bi-palette"></i>
            </button>
          `
            : ""
        }
        ${
          !task.archived && !task.deleted
            ? `
            <button class="card-btn warning archive-btn" data-id="${task.id}">
              <i class="bi bi-archive"></i>
            </button>
          `
            : ""
        }
        ${
          task.archived || task.deleted
            ? `
            <button class="card-btn restore-btn" data-id="${task.id}">
              <i class="bi bi-arrow-counterclockwise"></i>
            </button>
          `
            : ""
        }

        <button class="card-btn danger delete-btn" data-id="${task.id}">
          <i class="bi bi-trash3"></i>
        </button>

        </div>

        <div class="color-popup" id="cp-${task.id}">
          <div class="color-dot default" data-id="${task.id}" data-color="default"></div>
          <div class="color-dot yellow" data-id="${task.id}" data-color="yellow"></div>
          <div class="color-dot green" data-id="${task.id}" data-color="green"></div>
          <div class="color-dot blue" data-id="${task.id}" data-color="blue"></div>
          <div class="color-dot pink" data-id="${task.id}" data-color="pink"></div>
          <div class="color-dot purple" data-id="${task.id}" data-color="purple"></div>
          <div class="color-dot red" data-id="${task.id}" data-color="red"></div>
        </div>
      </div>
    `;
  }

  // ADD Card
  $("#add-btn").on("click", addTask);
  $("#task-input").on("keydown", function (e) {
    if (e.key === "Enter") {
      addTask();
    }
  });

  function addTask() {
    const text = $("#task-input").val().trim();

    if (!text) {
      alert("Please Enter Task....");
      return;
    }

    tasks.unshift({
      id: makeId(),
      text,
      pinned: false,
      archived: false,
      deleted: false,
      color: "",
    });

    save();
    render();

    $("#task-input").val("");
  }

  // PIN card
  $(document).on("click", ".pin-btn", function (e) {
    e.stopPropagation();

    const id = $(this).data("id");
    const task = tasks.find((t) => t.id === id);
    task.pinned = !task.pinned;

    save();
    render();
  });

  // Color Card
  $(document).on("click", ".color-btn", function (e) {
    e.stopPropagation();

    const id = $(this).data("id");
    const popup = $(`#cp-${id}`);

    if (activeColorPopup && activeColorPopup[0] !== popup[0]) {
      activeColorPopup.removeClass("open");
    }

    popup.toggleClass("open");
    activeColorPopup = popup.hasClass("open") ? popup : null;
  });
  // Close popup on outside click
  $(document).on("click", function () {
    if (activeColorPopup) {
      activeColorPopup.removeClass("open");
      activeColorPopup = null;
    }
  });

  $(document).on("click", ".color-dot", function (e) {
    e.stopPropagation();

    const id = $(this).data("id");
    const color = $(this).data("color");
    const task = tasks.find((t) => t.id === id);

    task.color = color;

    save();
    render();
  });

  // Archive Card
  $(document).on("click", ".archive-btn", function (e) {
    e.stopPropagation();

    const id = $(this).data("id");
    const task = tasks.find((t) => t.id === id);

    const ok = confirm("Are you sure you want to archive this task?");
    if (!ok) return;

    task.archived = true;

    save();
    render();
  });

  // Delete card
  $(document).on("click", ".delete-btn", function (e) {
    e.stopPropagation();

    const id = $(this).data("id");
    const task = tasks.find((t) => t.id === id);

    const msg = task.deleted
      ? "This will permanently delete this task. Continue?"
      : "Are you sure you want to move this task to Bin?";

    const ok = confirm(msg);
    if (!ok) return;

    if (task.deleted) {
      tasks = tasks.filter((t) => t.id !== id);
    } else {
      task.deleted = true;
      task.archived = false;
    }

    save();
    render();
  });

  // Select Card
  function updateSelectUI() {
    $(".task-card").removeClass("selected");

    if (selected.size > 0) {
      $("#select-actions").addClass("visible");
      $("body").addClass("select-mode");
    } else {
      $("#select-actions").removeClass("visible");
      $("body").removeClass("select-mode");
    }

    $("#sel-num").text(selected.size);

    selected.forEach((id) => {
      $(`.task-card[data-id="${id}"]`).addClass("selected");
    });

    if (currentSection === "bin") {
      $("#sel-archive-btn").hide();
    } else {
      $("#sel-archive-btn").show();
    }
  }
  $(document).on("click", ".card-select-check", function (e) {
    e.stopPropagation();

    const id = $(this).data("id");

    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }

    updateSelectUI();
  });

  // Multi-Archive Card
  $("#sel-archive-btn").on("click", function () {
    if (selected.size === 0) return;

    const ok = confirm(`Archive ${selected.size} selected task(s)?`);
    if (!ok) return;

    selected.forEach((id) => {
      const task = tasks.find((t) => t.id === id);

      if (task) {
        task.archived = true;
        task.deleted = false;
      }
    });

    save();
    render();
    selected.clear();

    updateSelectUI();
  });

  // Multi-Delete Card
  $("#sel-delete-btn").on("click", function () {
    if (selected.size === 0) return;

    const ok = confirm(
      `Are you sure you want to delete ${selected.size} task(s)? This may move them to Bin or permanently remove them.`,
    );

    if (!ok) return;
    selected.forEach((id) => {
      const task = tasks.find((t) => t.id === id);

      if (task.deleted) {
        tasks = tasks.filter((t) => t.id !== id);
      } else {
        task.deleted = true;
        task.archived = false;
      }
    });
    selected.clear();

    save();
    render();
    updateSelectUI();
  });

  // Cancel Selection
  $("#sel-cancel-btn").on("click", function () {
    selected.clear();
    updateSelectUI();
  });

  // Restore Card
  $(document).on("click", ".restore-btn", function (e) {
    e.stopPropagation();

    const id = $(this).data("id");
    const task = tasks.find((t) => t.id === id);

    task.archived = false;
    task.deleted = false;

    save();
    render();
  });

  // Expand Card
  $(document).on("click", ".task-card", function (e) {
    if (selected.size > 0) return;

    if (
      $(e.target).closest(
        ".card-btn, .card-select-check, .color-popup, .color-dot",
      ).length
    ) {
      return;
    }

    currentCard = $(this);

    currentEditId = currentCard.data("id");

    const task = tasks.find((t) => t.id === currentEditId);

    if (!task) return;

    const rect = currentCard[0].getBoundingClientRect();

    $("#expand-task-text").text(task.text);

    if (task.archived || task.deleted) {
      $("#update-task-btn").hide();
    } else {
      $("#update-task-btn").show();
    }

    // RESET OLD ANIMATION
    $("#expand-card").removeClass("open");

    $("#expand-card").css({
      transition: "none",
      top: "",
      left: "",
      width: "",
      height: "",
    });

    // FORCE REFLOW
    $("#expand-card")[0].offsetHeight;

    // ENABLE TRANSITION AGAIN
    $("#expand-card").css("transition", "");

    // START FROM CURRENT CARD POSITION
    $("#expand-card").css({
      top: rect.top + "px",
      left: rect.left + "px",
      width: rect.width + "px",
      height: rect.height + "px",
    });

    $("#expand-overlay").addClass("show");

    $("#expand-card").addClass("open");

    currentCard.css("visibility", "hidden");

    requestAnimationFrame(() => {
      const width = Math.min(700, window.innerWidth - 40);

      $("#expand-card").css({
        top: "80px",
        left: window.innerWidth / 2 - width / 2 + "px",
        width: width + "px",
        height: "300px",
      });
    });
  });

  /* CLOSE */
  $("#close-expand, #expand-overlay, #popup-close-icon").on(
    "click",
    closePopup,
  );
  function closePopup(shouldRender = false) {
    if (!currentCard) return;

    // HIDE BUTTONS + SCROLLBAR
    $(".popup-actions").hide();

    const rect = currentCard[0].getBoundingClientRect();

    $("#expand-card").css({
      top: rect.top + "px",
      left: rect.left + "px",
      width: rect.width + "px",
      height: rect.height + "px",
    });

    setTimeout(() => {
      $("#expand-card").removeClass("open");

      $("#expand-overlay").removeClass("show");

      currentCard.css("visibility", "visible");

      $("#expand-task-text")
        .attr("contenteditable", "false")
        .css("overflow", "auto");

      // SHOW BUTTONS AGAIN
      $(".popup-actions").show();

      $("#update-task-btn").text("Update");

      render();
    }, 280);
  }

  // UPDATE + SAVE
  $("#update-task-btn").on("click", function () {
    const task = tasks.find((t) => t.id === currentEditId);

    if (!task) return;
    const isEditing = $("#expand-task-text").attr("contenteditable") === "true";

    // SAVE
    if (isEditing) {
      const updatedText = $("#expand-task-text").text().trim();
      if (!updatedText) {
        alert("Task cannot be empty");
        return;
      }

      task.text = updatedText;
      currentCard.find(".card-body-text").text(updatedText);

      $("#expand-task-text").attr("contenteditable", "false");

      save();
      $(this).text("Update");
      closePopup();
    }

    // EDIT MODE
    else {
      $("#expand-task-text").attr("contenteditable", "true").focus();
      $(this).text("Save");
    }
  });

  render();
});
