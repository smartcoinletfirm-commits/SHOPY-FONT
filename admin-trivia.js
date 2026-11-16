
/* SHOPY FONT — ADMIN TRIVIA MANAGER */
(function () {
  "use strict";

  const SF = window.SF;
  if (!SF) return;

  const db = () => SF.getClient();
  const esc = value => SF.adminEscape(value ?? "");

  const previousTabs = SF.adminTabs;
  const previousLoad = SF.loadAdmin;
  const previousBind = SF.adminBindActions;

  SF.adminTabs = function () {
    return previousTabs() + `
      <button class="btn ${SF.adminTab === "trivia" ? "btn-gold" : "btn-outline"}"
        data-admin-tab="trivia">Trivia Manager</button>
    `;
  };

  SF.loadAdmin = async function (tab = SF.adminTab || "notifications") {
    if (tab !== "trivia") return previousLoad.apply(this, arguments);

    const box = document.getElementById("adminContent");
    if (!box) return;

    if (!SF.currentUser || !(await SF.checkAdmin())) {
      box.innerHTML = "<p>Administrator access is required.</p>";
      return;
    }

    SF.adminTab = "trivia";
    box.innerHTML = '<p class="muted">Loading Trivia Manager...</p>';

    try {
      box.innerHTML = SF.adminTabs() + await SF.adminTrivia();
      SF.adminBindActions(box);
    } catch (error) {
      box.innerHTML = SF.adminTabs() +
        `<p class="form-message">${esc(error.message)}</p>`;
    }
  };

  SF.adminTrivia = async function () {
    const [questionResult, attemptResult] = await Promise.all([
      db().from("trivia_questions")
        .select("id,question,options,reward_kes,is_active,created_at")
        .order("created_at", { ascending: false }),

      db().from("trivia_attempts")
        .select("id,user_id,question_id,selected_option,is_correct,reward_kes,submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(100)
    ]);

    if (questionResult.error) throw questionResult.error;
    if (attemptResult.error) throw attemptResult.error;

    const questions = questionResult.data || [];
    const attempts = attemptResult.data || [];
    const ids = [...new Set(attempts.map(x => x.user_id).filter(Boolean))];

    let profiles = [];

    if (ids.length) {
      const result = await db().from("profiles")
        .select("id,full_name,email")
        .in("id", ids);

      if (result.error) throw result.error;
      profiles = result.data || [];
    }

    const profileMap = new Map(profiles.map(p => [p.id, p]));
    const questionMap = new Map(questions.map(q => [q.id, q]));

    return `
      <section class="sf-trivia-admin">
        <h2>Trivia Manager</h2>
        <p class="muted">
          Create questions, set rewards, pause questions and review member attempts.
        </p>

        <form id="sfAdminTriviaForm" class="form-card">
          <h3 id="sfTriviaFormTitle">Add a trivia question</h3>

          <input type="hidden" name="id">

          <label>Question
            <textarea name="question" rows="3" required maxlength="1000"
              placeholder="Enter the question"></textarea>
          </label>

          <label>Answer options (one option per line)
            <textarea name="options" rows="5" required
              placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"></textarea>
          </label>

          <label>Correct answer (enter exact option text)
            <input name="correct_option" type="password" required
              autocomplete="off" placeholder="Enter the correct option">
          </label>

          <label>Reward (KES 2.00–4.50)
            <input name="reward_kes" type="number" min="2" max="4.5"
              step="0.01" required value="2.00">
          </label>

          <label>
            <input type="checkbox" name="is_active" checked>
            Make question active
          </label>

          <div class="admin-actions">
            <button type="submit" class="btn btn-gold">Save question</button>
            <button type="button" class="btn btn-outline"
              id="sfCancelTriviaEdit">Clear form</button>
          </div>

          <p class="muted">
            When editing, re-enter the correct answer.
            The existing answer is never displayed.
          </p>
        </form>

        <h3>Question bank (${questions.length})</h3>

        ${questions.length ? questions.map(q => `
          <article class="admin-row"
            style="display:block;margin:12px 0;padding:15px;">

            <div class="admin-actions">
              <strong>${esc(q.question)}</strong>
              <span class="status-pill">
                ${q.is_active ? "ACTIVE" : "PAUSED"}
              </span>
            </div>

            <p>Options: ${(q.options || []).map(esc).join(" · ")}</p>
            <p>Reward: KES ${Number(q.reward_kes).toFixed(2)}</p>

            <div class="admin-actions">
              <button class="btn btn-outline"
                data-edit-trivia="${q.id}">Edit question</button>

              <button class="btn btn-gold"
                data-toggle-trivia="${q.id}"
                data-active="${q.is_active ? "true" : "false"}">
                ${q.is_active ? "Pause question" : "Activate question"}
              </button>
            </div>
          </article>
        `).join("") : `
          <p class="muted">No trivia questions have been added yet.</p>
        `}

        <h3>Recent member attempts (${attempts.length})</h3>

        ${attempts.length ? attempts.map(a => {
          const member = profileMap.get(a.user_id) || {};
          const question = questionMap.get(a.question_id) || {};

          return `
            <article class="admin-row"
              style="display:block;margin:10px 0;padding:14px;">

              <strong>${esc(member.full_name || "Member")}</strong>
              <p>${esc(member.email || "")}</p>

              <p><strong>Question:</strong>
                ${esc(question.question || "Question unavailable")}</p>

              <p><strong>Selected:</strong>
                ${esc(a.selected_option)}</p>

              <p><strong>Result:</strong>
                ${a.is_correct ? "Correct" : "Incorrect"}</p>

              <p><strong>Reward:</strong>
                KES ${Number(a.reward_kes || 0).toFixed(2)}</p>

              <p class="muted">
                ${esc(new Date(a.submitted_at).toLocaleString())}
              </p>
            </article>
          `;
        }).join("") : `
          <p class="muted">No member attempts yet.</p>
        `}
      </section>
    `;
  };

  function clearForm() {
    const form = document.getElementById("sfAdminTriviaForm");
    if (!form) return;

    form.reset();
    form.elements.id.value = "";
    form.elements.reward_kes.value = "2.00";
    form.elements.is_active.checked = true;

    document.getElementById("sfTriviaFormTitle").textContent =
      "Add a trivia question";
  }

  async function saveQuestion(form) {
    const id = form.elements.id.value || null;

    const options = form.elements.options.value
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

    if (options.length < 2 || options.length > 6) {
      throw new Error("Enter between 2 and 6 options, one per line.");
    }

    const { data, error } = await db().rpc(
      "sf_admin_save_trivia_question",
      {
        p_question: form.elements.question.value.trim(),
        p_options: options,
        p_correct_option: form.elements.correct_option.value.trim(),
        p_reward_kes: Number(form.elements.reward_kes.value),
        p_question_id: id,
        p_is_active: form.elements.is_active.checked
      }
    );

    if (error) throw error;

    if (!data?.success) {
      throw new Error(data?.message || "Question was not saved.");
    }

    SF.showToast(id
      ? "Trivia question updated."
      : "Trivia question added.");

    await SF.loadAdmin("trivia");
  }

  async function editQuestion(id) {
    const { data, error } = await db()
      .from("trivia_questions")
      .select("id,question,options,reward_kes,is_active")
      .eq("id", id)
      .single();

    if (error) throw error;

    const form = document.getElementById("sfAdminTriviaForm");

    form.elements.id.value = data.id;
    form.elements.question.value = data.question;
    form.elements.options.value = (data.options || []).join("\n");

    // Correct answers remain private.
    form.elements.correct_option.value = "";

    form.elements.reward_kes.value = data.reward_kes;
    form.elements.is_active.checked = data.is_active;

    document.getElementById("sfTriviaFormTitle").textContent =
      "Edit trivia question";

    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function toggleQuestion(id, active) {
    const { error } = await db()
      .from("trivia_questions")
      .update({ is_active: !active })
      .eq("id", id);

    if (error) throw error;

    SF.showToast(active
      ? "Trivia question paused."
      : "Trivia question activated.");

    await SF.loadAdmin("trivia");
  }

  SF.adminBindActions = function (box) {
    previousBind(box);

    box.querySelectorAll("[data-admin-tab='trivia']")
      .forEach(button => {
        button.addEventListener("click", () => SF.loadAdmin("trivia"));
      });

    const form = box.querySelector("#sfAdminTriviaForm");

    form?.addEventListener("submit", async event => {
      event.preventDefault();

      try {
        await saveQuestion(form);
      } catch (error) {
        SF.showToast(error.message);
      }
    });

    box.querySelector("#sfCancelTriviaEdit")
      ?.addEventListener("click", clearForm);

    box.querySelectorAll("[data-edit-trivia]")
      .forEach(button => {
        button.addEventListener("click", async () => {
          try {
            await editQuestion(button.dataset.editTrivia);
          } catch (error) {
            SF.showToast(error.message);
          }
        });
      });

    box.querySelectorAll("[data-toggle-trivia]")
      .forEach(button => {
        button.addEventListener("click", async () => {
          try {
            await toggleQuestion(
              button.dataset.toggleTrivia,
              button.dataset.active === "true"
            );
          } catch (error) {
            SF.showToast(error.message);
          }
        });
      });
  };
})();
    
