
// SHOPY FONT — KNOW & EARN ADMIN MODULE
// Independent from old Trivia.

(() => {
  if (!window.SF) return;

  const SF = window.SF;

  SF.adminKnowEarn = async () => {
    const db = SF.getClient();

    const [questionsResult, attemptsResult, rewardsResult] =
      await Promise.all([
        db.from("sf_know_earn_questions")
          .select("*")
          .order("created_at", { ascending: false }),

        db.from("sf_know_earn_attempts")
          .select("id,user_id,question_id,selected_option,is_correct,reward_usd,attempt_date,created_at")
          .order("created_at", { ascending: false })
          .limit(500),

        db.from("sf_know_earn_rewards")
          .select("id,user_id,question_id,amount_usd,created_at")
          .order("created_at", { ascending: false })
          .limit(500)
      ]);

    if (questionsResult.error) throw questionsResult.error;
    if (attemptsResult.error) throw attemptsResult.error;
    if (rewardsResult.error) throw rewardsResult.error;

    const questions = questionsResult.data || [];
    const attempts = attemptsResult.data || [];
    const rewards = rewardsResult.data || [];

    return `
      <div class="sf-ke-admin">
        <div class="sf-ke-admin-header">
          <h2>KNOW & EARN</h2>
          <p>Manage questions and monitor member performance.</p>
        </div>

        <div class="sf-ke-admin-stats">
          <div class="admin-row">
            <strong>${questions.length}</strong>
            <p>Total questions</p>
          </div>

          <div class="admin-row">
            <strong>${questions.filter(q => q.is_active).length}</strong>
            <p>Published questions</p>
          </div>

          <div class="admin-row">
            <strong>${attempts.length}</strong>
            <p>Attempts recorded</p>
          </div>

          <div class="admin-row">
            <strong>$${rewards.reduce((sum, r) =>
              sum + Number(r.amount_usd || 0), 0).toFixed(2)}</strong>
            <p>Rewards recorded</p>
          </div>
        </div>

        <div class="admin-row" style="display:block;padding:15px;margin:15px 0">
          <h3>Create Question</h3>

          <form id="sfKnowEarnCreateForm">
            <label>Question</label>
            <textarea name="question" required
              placeholder="Enter your question"
              style="width:100%;min-height:90px"></textarea>

            <label>Option A</label>
            <input name="option_a" required>

            <label>Option B</label>
            <input name="option_b" required>

            <label>Option C</label>
            <input name="option_c" required>

            <label>Option D</label>
            <input name="option_d" required>

            <label>Correct Answer</label>
            <select name="correct_option" required>
              <option value="">Select correct answer</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>

            <label>Reward (USD)</label>
            <input name="reward_usd" type="number"
              min="0" step="0.01" value="0" required>

            <button class="btn btn-gold" type="submit">
              Save Question
            </button>
          </form>
        </div>

        <h3>Question Management (${questions.length})</h3>

        ${
          questions.length
            ? questions.map(q => `
              <div class="admin-row" style="display:block;padding:14px;margin:12px 0">
                <strong>${SF.adminEscape(q.question)}</strong>

                <p>A. ${SF.adminEscape(q.option_a)}</p>
                <p>B. ${SF.adminEscape(q.option_b)}</p>
                <p>C. ${SF.adminEscape(q.option_c)}</p>
                <p>D. ${SF.adminEscape(q.option_d)}</p>

                <p>Correct answer: <strong>${SF.adminEscape(q.correct_option)}</strong></p>
                <p>Reward: <strong>$${Number(q.reward_usd || 0).toFixed(2)}</strong></p>
                <p>Status: ${q.is_active ? "Published" : "Paused"}</p>

                <div class="admin-actions">
                  <button class="btn btn-outline"
                    data-ke-toggle="${q.id}"
                    data-ke-active="${q.is_active}">
                    ${q.is_active ? "Pause" : "Publish"}
                  </button>

                  <button class="btn btn-outline"
                    data-ke-edit="${q.id}">
                    Edit
                  </button>

                  <button class="btn btn-outline"
                    data-ke-delete="${q.id}">
                    Delete
                  </button>
                </div>
              </div>
            `).join("")
            : `<p class="muted">No questions created yet.</p>`
        }

        <h3>Recent Attempts</h3>

        ${
          attempts.length
            ? attempts.slice(0, 100).map(a => `
              <div class="admin-row">
                <strong>Member: ${SF.adminEscape(a.user_id)}</strong>
                <p>Selected: ${SF.adminEscape(a.selected_option)}</p>
                <p>Result: ${a.is_correct ? "Correct" : "Wrong"}</p>
                <p>Reward: $${Number(a.reward_usd || 0).toFixed(2)}</p>
                <p>Date: ${SF.adminEscape(a.attempt_date || "")}</p>
              </div>
            `).join("")
            : `<p class="muted">No attempts recorded.</p>`
        }
      </div>
    `;
  };

  // Save a new question.
  SF.adminKnowEarnSave = async form => {
    const db = SF.getClient();
    const fd = new FormData(form);

    const payload = {
      question: String(fd.get("question") || "").trim(),
      option_a: String(fd.get("option_a") || "").trim(),
      option_b: String(fd.get("option_b") || "").trim(),
      option_c: String(fd.get("option_c") || "").trim(),
      option_d: String(fd.get("option_d") || "").trim(),
      correct_option: String(fd.get("correct_option") || ""),
      reward_usd: Number(fd.get("reward_usd") || 0),
      is_active: false
    };

    if (
      !payload.question ||
      !payload.option_a ||
      !payload.option_b ||
      !payload.option_c ||
      !payload.option_d
    ) {
      return SF.showToast("Fill in all question fields.");
    }

    if (!["A", "B", "C", "D"].includes(payload.correct_option)) {
      return SF.showToast("Select the correct answer.");
    }

    if (!Number.isFinite(payload.reward_usd) || payload.reward_usd < 0) {
      return SF.showToast("Invalid reward amount.");
    }

    const { error } = await db
      .from("sf_know_earn_questions")
      .insert(payload);

    if (error) throw error;

    SF.showToast("Question saved.");
    await SF.loadAdmin("know-earn");
  };

  // Publish / pause question.
  SF.adminKnowEarnToggle = async (id, active) => {
    const { error } = await SF.getClient()
      .from("sf_know_earn_questions")
      .update({
        is_active: !active,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;

    SF.showToast(!active ? "Question published." : "Question paused.");
    await SF.loadAdmin("know-earn");
  };

  // Delete question.
  SF.adminKnowEarnDelete = async id => {
    if (!confirm("Delete this question?")) return;

    const { error } = await SF.getClient()
      .from("sf_know_earn_questions")
      .delete()
      .eq("id", id);

    if (error) throw error;

    SF.showToast("Question deleted.");
    await SF.loadAdmin("know-earn");
  };

  // Edit question.
  SF.adminKnowEarnEdit = async id => {
    const db = SF.getClient();

    const { data: q, error } = await db
      .from("sf_know_earn_questions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const question = prompt("Edit question:", q.question);
    if (question === null) return;

    const a = prompt("Option A:", q.option_a);
    if (a === null) return;

    const b = prompt("Option B:", q.option_b);
    if (b === null) return;

    const c = prompt("Option C:", q.option_c);
    if (c === null) return;

    const d = prompt("Option D:", q.option_d);
    if (d === null) return;

    const answer = prompt("Correct answer (A, B, C, or D):", q.correct_option);
    if (answer === null) return;

    const reward = prompt("Reward USD:", q.reward_usd);
    if (reward === null) return;

    const payload = {
      question: question.trim(),
      option_a: a.trim(),
      option_b: b.trim(),
      option_c: c.trim(),
      option_d: d.trim(),
      correct_option: answer.trim().toUpperCase(),
      reward_usd: Number(reward),
      updated_at: new Date().toISOString()
    };

    if (
      !payload.question ||
      !payload.option_a ||
      !payload.option_b ||
      !payload.option_c ||
      !payload.option_d ||
      !["A", "B", "C", "D"].includes(payload.correct_option) ||
      !Number.isFinite(payload.reward_usd) ||
      payload.reward_usd < 0
    ) {
      return SF.showToast("Invalid question details.");
    }

    const { error: updateError } = await db
      .from("sf_know_earn_questions")
      .update(payload)
      .eq("id", id);

    if (updateError) throw updateError;

    SF.showToast("Question updated.");
    await SF.loadAdmin("know-earn");
  };

  // Bind form and buttons.
  SF.adminKnowEarnBind = box => {
    const form = box.querySelector("#sfKnowEarnCreateForm");

    if (form) {
      form.addEventListener("submit", async event => {
        event.preventDefault();

        try {
          await SF.adminKnowEarnSave(form);
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    }

    box.querySelectorAll("[data-ke-toggle]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await SF.adminKnowEarnToggle(
            button.dataset.keToggle,
            button.dataset.keActive === "true"
          );
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    });

    box.querySelectorAll("[data-ke-edit]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await SF.adminKnowEarnEdit(button.dataset.keEdit);
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    });

    box.querySelectorAll("[data-ke-delete]").forEach(button => {
      button.addEventListener("click", async () => {
        try {
          await SF.adminKnowEarnDelete(button.dataset.keDelete);
        } catch (error) {
          SF.showToast(error.message);
        }
      });
    });
  };

})();
