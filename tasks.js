
function installTaskStyles() {
  if (document.getElementById("sfTaskStyles")) return;

  const style = document.createElement("style");
  style.id = "sfTaskStyles";

  style.textContent = `
    #tasksView .sf-task-summary {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:12px;
      margin:18px 0;
    }
    #tasksView .sf-task-stat {
      padding:16px;
      border:1px solid #e3ebe4;
      border-radius:16px;
      background:linear-gradient(145deg,#fff,#f4f8f4);
      box-shadow:0 8px 22px rgba(16,58,39,.06);
    }
    #tasksView .sf-task-stat span {
      display:block;
      color:#718176;
      font-size:10px;
      font-weight:800;
      text-transform:uppercase;
    }
    #tasksView .sf-task-stat strong {
      display:block;
      margin-top:8px;
      color:#164b34;
      font-size:22px;
    }
    #tasksView .sf-task-tabs {
      display:flex;
      gap:8px;
      margin:20px 0;
      padding:6px;
      border-radius:14px;
      background:#edf3ee;
    }
    #tasksView .sf-task-tab {
      flex:1;
      padding:12px;
      border:0;
      border-radius:10px;
      background:transparent;
      color:#50675a;
      font-weight:800;
      cursor:pointer;
    }
    #tasksView .sf-task-tab.active {
      background:#176b45;
      color:white;
    }
    #tasksView .sf-task-list {
      display:grid;
      grid-template-columns:repeat(2,minmax(0,1fr));
      gap:14px;
    }
    #tasksView .sf-task-card {
      padding:19px;
      border:1px solid #e3ebe4;
      border-radius:17px;
      background:white;
      box-shadow:0 9px 24px rgba(17,57,39,.06);
      transition:.2s;
    }
    #tasksView .sf-task-card:hover {
      transform:translateY(-2px);
      box-shadow:0 13px 28px rgba(17,57,39,.10);
    }
    #tasksView .sf-task-card-top {
      display:flex;
      justify-content:space-between;
      gap:8px;
      flex-wrap:wrap;
    }
    #tasksView .sf-task-type {
      padding:6px 10px;
      border-radius:30px;
      background:#edf6ef;
      color:#17633f;
      font-size:10px;
      font-weight:900;
    }
    #tasksView .sf-task-reward {
      padding:7px 10px;
      border-radius:30px;
      background:#fff5e4;
      color:#986b1d;
      font-weight:900;
    }
    #tasksView .sf-task-submit,
    #tasksView .sf-task-form button[type="submit"] {
      width:100%;
      padding:13px;
      border:0;
      border-radius:11px;
      background:linear-gradient(135deg,#16804f,#0d5737);
      color:white;
      font-weight:900;
      cursor:pointer;
    }
    #tasksView .sf-task-status {
      display:inline-flex;
      padding:6px 10px;
      border-radius:30px;
      font-size:10px;
      font-weight:900;
    }
    #tasksView .sf-task-status.approved {
      background:#e7f7ed;
      color:#147342;
    }
    #tasksView .sf-task-status.rejected {
      background:#fff0f0;
      color:#b8323b;
    }
    #tasksView .sf-task-status.pending,
    #tasksView .sf-task-status.submitted {
      background:#fff5df;
      color:#946414;
    }
    #tasksView .sf-task-empty {
      grid-column:1/-1;
      padding:28px;
      border:1px dashed #cbd9cd;
      border-radius:16px;
      background:#f8fbf8;
      text-align:center;
    }
    @media(max-width:650px) {
      #tasksView .sf-task-list {
        grid-template-columns:1fr;
      }
      #tasksView .sf-task-stat {
        padding:11px;
      }
      #tasksView .sf-task-stat strong {
        font-size:17px;
      }
    }
  `;

  document.head.appendChild(style);
}
