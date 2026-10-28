/**
 * Application Core Logic
 */
let posts = [];
let activeTag = "All";
let searchQuery = "";
let currentArticleId = null;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  loadPosts();
  initTheme();
  renderTagFilters();
  renderArticles();
  setupScrollListener();
  lucide.createIcons();
});

// Storage and Post Loading
function loadPosts() {
  const local = localStorage.getItem("kusagra_blog_posts");
  if (local) {
    posts = JSON.parse(local);
  } else {
    posts = [...initialPosts];
    localStorage.setItem("kusagra_blog_posts", JSON.stringify(posts));
  }
}

// Theme Toggle
function initTheme() {
  const isDark = localStorage.getItem("theme") !== "light";
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  updateThemeIcon(isDark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  const icon = document.getElementById("theme-icon");
  if (icon) {
    icon.setAttribute("data-lucide", isDark ? "sun" : "moon");
    lucide.createIcons();
  }
}

// Navigation between views
function navigateTo(viewName, articleId = null) {
  document.getElementById("view-feed").classList.add("hidden");
  document.getElementById("view-reader").classList.add("hidden");
  document.getElementById("view-editor").classList.add("hidden");

  window.scrollTo({ top: 0, behavior: "smooth" });

  if (viewName === "feed") {
    document.getElementById("view-feed").classList.remove("hidden");
    document.getElementById("reading-progress").style.width = "0%";
    currentArticleId = null;
  } else if (viewName === "reader") {
    document.getElementById("view-reader").classList.remove("hidden");
    loadArticleView(articleId);
  } else if (viewName === "editor") {
    document.getElementById("view-editor").classList.remove("hidden");
    updateLivePreview();
  }
  lucide.createIcons();
}

// Tag Filtering
function getAllTags() {
  const tags = new Set();
  posts.forEach(p => p.tags.forEach(t => tags.add(t)));
  return ["All", ...Array.from(tags)];
}

function renderTagFilters() {
  const container = document.getElementById("tag-filters");
  const tags = getAllTags();
  
  container.innerHTML = tags.map(tag => `
    <button 
      onclick="filterByTag('${tag}')"
      class="text-xs px-2.5 py-1 rounded-lg font-mono transition ${
        activeTag === tag 
          ? 'bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 font-semibold' 
          : 'bg-stone-200/60 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700'
      }"
    >
      ${tag}
    </button>
  `).join("");
}

function filterByTag(tag) {
  activeTag = tag;
  renderTagFilters();
  renderArticles();
}

function handleSearch(val) {
  searchQuery = val.trim().toLowerCase();
  renderArticles();
}

// Render Feed
function renderArticles() {
  const container = document.getElementById("articles-container");
  
  const filtered = posts.filter(post => {
    const matchesTag = activeTag === "All" || post.tags.includes(activeTag);
    const matchesQuery = 
      post.title.toLowerCase().includes(searchQuery) ||
      post.excerpt.toLowerCase().includes(searchQuery) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery));
    return matchesTag && matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center text-stone-400">
        <p class="text-sm">No articles found matching your criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => `
    <article class="group p-5 -mx-5 rounded-2xl hover:bg-stone-100/60 dark:hover:bg-stone-900/60 transition cursor-pointer border border-transparent hover:border-stone-200/50 dark:hover:border-stone-800/50" onclick="navigateTo('reader', '${post.id}')">
      <div class="flex items-center space-x-2 text-xs font-mono text-stone-400 mb-2">
        <span class="text-indigo-600 dark:text-indigo-400 font-medium">${post.category}</span>
        <span>•</span>
        <span>${post.date}</span>
        <span>•</span>
        <span>${post.readTime}</span>
      </div>

      <h3 class="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
        ${post.title}
      </h3>

      <p class="text-stone-600 dark:text-stone-300 text-sm mt-2 line-clamp-2 leading-relaxed">
        ${post.excerpt}
      </p>

      <div class="flex items-center gap-1.5 mt-3">
        ${post.tags.map(t => `<span class="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300">${t}</span>`).join("")}
      </div>
    </article>
  `).join("");

  lucide.createIcons();
}

// Reader Logic
function loadArticleView(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return navigateTo("feed");

  currentArticleId = post.id;
  document.getElementById("reader-category").textContent = post.category;
  document.getElementById("reader-title").textContent = post.title;
  document.getElementById("reader-date").textContent = post.date;
  document.getElementById("reader-reading-time").textContent = post.readTime;
  document.getElementById("reader-body").innerHTML = marked.parse(post.content);
  document.getElementById("like-counter").textContent = `${post.likes} likes`;
  lucide.createIcons();
}

function toggleArticleLike() {
  if (!currentArticleId) return;
  const post = posts.find(p => p.id === currentArticleId);
  if (post) {
    post.likes += 1;
    document.getElementById("like-counter").textContent = `${post.likes} likes`;
    localStorage.setItem("kusagra_blog_posts", JSON.stringify(posts));
  }
}

function copyCurrentLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied to clipboard!");
}

// In-Browser Post Editor
function updateLivePreview() {
  const content = document.getElementById("editor-content").value;
  document.getElementById("editor-preview").innerHTML = marked.parse(content || "*Preview will appear here...*");
}

function publishPost() {
  const title = document.getElementById("editor-title").value.trim();
  const category = document.getElementById("editor-category").value.trim() || "General";
  const tagsInput = document.getElementById("editor-tags").value.trim();
  const content = document.getElementById("editor-content").value.trim();

  if (!title || !content) {
    alert("Please provide both a title and article content.");
    return;
  }

  const tags = tagsInput ? tagsInput.split(",").map(t => t.trim()).filter(Boolean) : ["Note"];
  const newPost = {
    id: "post-" + Date.now(),
    title,
    category,
    tags,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    readTime: `${Math.max(1, Math.ceil(content.split(" ").length / 200))} min read`,
    likes: 0,
    excerpt: content.replace(/[#*`]/g, "").slice(0, 140) + "...",
    content
  };

  posts.unshift(newPost);
  localStorage.setItem("kusagra_blog_posts", JSON.stringify(posts));

  // Reset inputs
  document.getElementById("editor-title").value = "";
  document.getElementById("editor-category").value = "";
  document.getElementById("editor-tags").value = "";
  document.getElementById("editor-content").value = "";

  renderTagFilters();
  navigateTo("reader", newPost.id);
}

// Reading Progress Indicator
function setupScrollListener() {
  window.addEventListener("scroll", () => {
    const reader = document.getElementById("view-reader");
    if (!reader.classList.contains("hidden")) {
      const totalHeight = reader.clientHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        document.getElementById("reading-progress").style.width = `${progress}%`;
      }
    }
  });
}

// Drawer Toggle
function toggleAboutDrawer() {
  const drawer = document.getElementById("about-drawer");
  drawer.classList.toggle("hidden");
  lucide.createIcons();
}

function openEditor() {
  const adminSecret = "Hellokush@1234"; 
  const enteredPass = prompt("Enter author access key:");

  if (enteredPass === adminSecret) {
    navigateTo('editor');
  } else {
    alert("Unauthorized access.");
  }
}
// Reveal "Draft Post" only when visiting with: ?admin=kusagra_access
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === 'kusagra_access') {
    const draftBtn = document.getElementById('draft-post-btn');
    if (draftBtn) {
      draftBtn.classList.remove('hidden');
      draftBtn.classList.add('flex');
    }
  }
});