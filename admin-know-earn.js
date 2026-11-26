
/* SHOPY FONT — KNOW & EARN ADMIN */
(function () {
  "use strict";

  const SF = window.SF;
  if (!SF) return;

  const db = () => SF.getClient();
  const esc = v => SF.adminEscape(v ?? "");
  const oldTabs = SF.adminTabs;
  const oldLoad = SF.loadAdmin;
  const oldBind = SF.adminBindActions;

  // Add KNOW & EARN to the existing admin navigation.
  SF.adminTabs = function () {
    return oldTabs() + `
      <button class="btn ${SF.adminTab === "know-earn" ? "btn-gold" : "btn-outline"}"
        data-admin-tab="know-earn">
        KNOW & EARN
      </button>`;
  };

  // Load KNOW & EARN without changing the existing admin sections.
  SF.loadAdmin = async function (tab = SF.adminTab || "notifications") {
    if (tab !== "know-earn") return oldLoad.apply(this, arguments);

    const box = document.getElementById("adminContent");
    if (!box) return;

    if (!SF.currentUser || !(await SF.checkAdmin())) {
      box.innerHTML = "<p>Administrator access required.</p>";
      return;
    }

    SF.adminTab = "know-earn";
    box.innerHTML = "<p>Loading KNOW & EARN...</p>";

    try {
      box.innerHTML = SF.adminTabs() + await SF.adminKnowEarn();
      SF.adminBindActions(box);
    } catch (error) {
      box.innerHTML = SF.adminTabs() +
        `<p class="form-message">${esc(error.message)}</p>`;
    }
  };

  // Admin workspace.
  SF.adminKnowEarn = async function () {
    const [questionsResult, attemptsResult, rewardsResult] =
      await Promise.all([
        db().from("sf_know_earn_questions")
          .select("*")
          .order("created_at", { ascending: false }),

        db().from("sf_know_earn_attempts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),

        db().from("sf_know_earn_rewards")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100)
      ]);

    if (questionsResult.error) throw questionsResult.error;
    if (attemptsResult.error) throw attemptsResult.error;
    if (rewardsResult.error) throw rewardsResult.error;

    const questions = questionsResult.data || [];
    const attempts = attemptsResult.data || [];
    const rewards = rewardsResult.data || [];

    window.__sfKnowEarnQuestions = questions;

    const questionMap = new Map(questions.map(q => [q.id, q]));

    const userIds = [
      ...new Set([...attempts, ...rewards].map(x => x.user_id))
    ].filter(Boolean);

    let profiles = [];

    if (userIds.length) {
      const result = await db()
        .from("profiles")
        .select("id,full_name,email")
        .in("id", userIds);

      if (result.error) throw result.error;
      profiles = result.data || [];
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const usd = amount => "$" + Number(amount || 0).toFixed(2);

    return `
      <section class="sf-know-earn-admin">

        <h2>KNOW & EARN Control Center</h2>

        <p class="muted">
          Manage questions, USD rewards, publication and member performance.
        </p>

        <div class="admin-actions" style="flex-wrap:wrap;margin:15px 0">
          <span class="status-pill">Questions: ${questions.length}</span>
          <span class="status-pill">
            Published: ${questions.filter(q => q.is_active).length}
          </span>
          <span class="status-pill">Attempts: ${attempts.length}</span>
          <span class="status-pill">Rewards: ${rewards.length}</span>
        </div>

        <form id="sfKnowEarnForm" class="form-card">

          <h3 id="sfKnowEarnTitle">Create a question</h3>

          <input type="hidden" name="id">

          <label>Question
            <textarea name="question" rows="3" maxlength="1500"
              required placeholder="Write your question"></textarea>
          </label>

          <label>Option A
            <input name="option_a" required maxlength="500">
          </label>

          <label>Option B
            <input name="option_b" required maxlength="500">
          </label>

          <label>Option C
            <input name="option_c" required maxlength="500">
          </label>

          <label>Option D
            <input name="option_d" required maxlength="500">
          </label>

          <label>Correct answer
            <select name="correct_option" required>
              <option value="">Select correct answer</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>

          <label>Reward in USD
            <input name="reward_usd" type="number"
              min="0" step="0.01" value="0.10" required>
          </label>

          <label style="display:flex;align-items:center;gap:8px">
            <input name="is_active" type="checkbox">
            Publish immediately
          </label>

          <div class="admin-actions">
            <button class="btn btn-gold" type="submit">
              Save question
            </button>

            <button class="btn btn-outline" type="button"
              id="sfKnowEarnClear">
              Clear form
            </button>
          </div>

        </form>

        <h3>Question bank (${questions.length})</h3>

        ${questions.length ? questions.map(q => `
          <article class="admin-row"
            style="display:block;margin:12px 0;padding:15px">

            <div class="admin-actions"
              style="justify-content:space-between;flex-wrap:wrap">

              <strong>${esc(q.question)}</strong>

              <span class="status-pill">
                ${q.is_active ? "PUBLISHED" : "PAUSED"}
              </span>
            </div>

            <p>
              A: ${esc(q.option_a)}<br>
              B: ${esc(q.option_b)}<br>
              C: ${esc(q.option_c)}<br>
              D: ${esc(q.option_d)}
            </p>

            <p><strong>Reward:</strong> ${usd(q.reward_usd)}</p>

            <div class="admin-actions">
              <button class="btn btn-outline"
                data-ke-edit="${q.id}">
                Edit
              </button>

              <button class="btn btn-gold"
                data-ke-toggle="${q.id}"
                data-ke-active="${q.is_active}">
                ${q.is_active ? "Pause" : "Publish"}
              </button>

              <button class="btn btn-outline"
                data-ke-delete="${q.id}">
                Delete
              </button>
            </div>
          </article>
        `).join("") : `
          <p class="muted">No questions have been created yet.</p>
        `}

        <h3>Recent member attempts (${attempts.length})</h3>

        ${attempts.length ? attempts.map(a => {
          const member = profileMap.get(a.user_id) || {};
          const q = questionMap.get(a.question_id) || {};

          return `
            <article class="admin-row"
              style="display:block;margin:10px 0;padding:14px">

              <strong>${esc(member.full_name || "Member")}</strong>

              <p>${esc(member.email || "")}</p>

              <p><strong>Question:</strong>
                ${esc(q.question || "Unavailable")}
              </p>

              <p>Selected: ${esc(a.selected_option)}</p>

              <p><strong>Result:</strong>
                ${a.is_correct ? "Correct" : "Wrong"}
              </p>

              <p><strong>Reward:</strong> ${usd(a.reward_usd)}</p>

              <p class="muted">
                ${esc(new Date(a.created_at).toLocaleString())}
              </p>
            </article>
          `;
        }).join("") : `
          <p class="muted">No member attempts recorded yet.</p>
        `}

        <h3>Reward records (${rewards.length})</h3>

        ${rewards.length ? rewards.map(r => {
          const member = profileMap.get(r.user_id) || {};
          const q = questionMap.get(r.question_id) || {};

          return `
            <article class="admin-row"
              style="display:block;margin:10px 0;padding:12px">

              <strong>${esc(member.full_name || "Member")}</strong>

              <p>${esc(q.question || "Question unavailable")}</p>

              <p><strong>Reward:</strong> ${usd(r.amount_usd)}</p>

              <p class="muted">
                ${esc(new Date(r.created_at).toLocaleString())}
              </p>
            </article>
          `;
        }).join("") : `
          <p class="muted">No reward records yet.</p>
        `}

      </section>
    `;
  };

  // Reset the question editor.
  function clearForm() {
    const form = document.getElementById("sfKnowEarnForm");
    if (!form) return;

    form.reset();
    form.elements.id.value = "";
    form.elements.reward_usd.value = "0.10";

    document.getElementById("sfKnowEarnTitle").textContent =
      "Create a question";
  }

  // Load question into editor.
  function editQuestion(id) {
    const form = document.getElementById("sfKnowEarnForm");

    const q = (window.__sfKnowEarnQuestions || [])
      .find(item => item.id === id);

    if (!form || !q) return;

    form.elements.id.value = q.id;
    form.elements.question.value = q.question;
    form.elements.option_a.value = q.option_a;
    form.elements.option_b.value = q.option_b;
    form.elements.option_c.value = q.option_c;
    form.elements.option_d.value = q.option_d;
    form.elements.correct_option.value = q.correct_option;
    form.elements.reward_usd.value = q.reward_usd;
    form.elements.is_active.checked = q.is_active;

    document.getElementById("sfKnowEarnTitle").textContent =
      "Edit question";

    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  // Save using the secure Supabase RPC.
  async function saveQuestion(form) {
    const id = form.elements.id.value || null;

    const { error } = await db().rpc(
      "sf_know_earn_admin_save",
      {
        p_question_id: id,
        p_question: form.elements.question.value.trim(),
        p_option_a: form.elements.option_a.value.trim(),
        p_option_b: form.elements.option_b.value.trim(),
        p_option_c: form.elements.option_c.value.trim(),
        p_option_d: form.elements.option_d.value.trim(),
        p_correct_option: form.elements.correct_option.value,
        p_reward_usd: Number(form.elements.reward_usd.value),
        p_is_active: form.elements.is_active.checked
      }
    );

    if (error) throw error;

    SF.showToast(id ? "Question updated." : "Question saved.");
    await SF.loadAdmin("know-earn");
  }

  // Publish or pause.
  async function toggleQuestion(id, active) {
    const { error } = await db().rpc(
      "sf_know_earn_admin_toggle",
      {
        p_question_id: id,
        p_is_active: !active
      }
    );

    if (error) throw error;

    SF.showToast(active ? "Question paused." : "Question published.");
    await SF.loadAdmin("know-earn");
  }

  // Delete unused questions.
  async function deleteQuestion(id) {
    if (!confirm(
      "Delete this question? Questions with attempts cannot be deleted. Pause them instead."
    )) return;

    const { error } = await db().rpc(
      "sf_know_earn_admin_delete",
      { p_question_id: id }
    );

    if (error) throw error;

    SF.showToast("Question deleted.");
    await SF.loadAdmin("know-earn");
  }

  // Add handlers while preserving existing admin actions.
  SF.adminBindActions = function (box) {
    oldBind(box);

    box.querySelectorAll("[data-admin-tab='know-earn']")
      .forEach(button => {
        button.addEventListener("click", () =>
          SF.loadAdmin("know-earn")
        );
      });

    const form = box.querySelector("#sfKnowEarnForm");

    form?.addEventListener("submit", async event => {
      event.preventDefault();

      try {
        await saveQuestion(form);
      } catch (error) {
        SF.showToast(error.message);
      }
    });

    box.querySelector("#sfKnowEarnClear")
      ?.addEventListener("click", clearForm);

    box.querySelectorAll("[data-ke-edit]")
      .forEach(button => {
        button.addEventListener("click", () =>
          editQuestion(button.dataset.keEdit)
        );
      });

    box.querySelectorAll("[data-ke-toggle]")
      .forEach(button => {
        button.addEventListener("click", async () => {
          try {
            await toggleQuestion(
              button.dataset.keToggle,
              button.dataset.keActive === "true"
            );
          } catch (error) {
            SF.showToast(error.message);
          }
        });
      });

    box.querySelectorAll("[data-ke-delete]")
      .forEach(button => {
        button.addEventListener("click", async () => {
          try {
            await deleteQuestion(button.dataset.keDelete);
          } catch (error) {
            SF.showToast(error.message);
          }
        });
      });
  };

})();
        
