/* SHOPY FONT — COMMUNITY ADMIN EXTENSION */
(() => {
  "use strict";

  window.SF = window.SF || {};

  const SF = window.SF;

  if (!SF.adminTabs || !SF.loadAdmin || !SF.adminBindActions) {
    console.error("Community Admin: admin.js must load first.");
    return;
  }

  /* ADD COMMUNITY TAB */
  const originalTabs = SF.adminTabs;

  SF.adminTabs = () => {
    const html = originalTabs();

    const button = `
      <button class="btn ${
        SF.adminTab === "community" ? "btn-gold" : "btn-outline"
      }" data-admin-tab="community">
        Community
      </button>
    `;

    return html.replace("</div>", button + "</div>");
  };

  /* COMMUNITY ADMIN PAGE */
  SF.adminCommunity = async () => {
    const db = SF.getClient();

    const [requestsResult, fbkResult] = await Promise.all([
      db.from("sf_community_requests")
        .select("*")
        .order("created_at", { ascending: false }),

      db.from("sf_community_fbk_submissions")
        .select("*")
        .order("created_at", { ascending: false })
    ]);

    if (requestsResult.error) throw requestsResult.error;
    if (fbkResult.error) throw fbkResult.error;

    const requests = requestsResult.data || [];
    const submissions = fbkResult.data || [];

    const escape = value => SF.adminEscape(value ?? "Not available");

    const details = record => {
      return Object.entries(record)
        .filter(([key]) => ![
          "id",
          "user_id"
        ].includes(key))
        .map(([key, value]) => `
          <p style="margin:5px 0;">
            <strong>${escape(key.replaceAll("_", " "))}:</strong>
            ${escape(
              typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : value
            )}
          </p>
        `).join("");
    };

    const reviewed = status =>
      ["approved", "rejected", "reviewed", "complete", "completed"]
        .includes(String(status || "").toLowerCase());

    return `
      <h2>Community management</h2>

      <p class="muted">
        Community entry fee: KES 200.
        Confirm receipt of payment manually before approving a member.
      </p>

      <h3>Community membership requests (${requests.length})</h3>

      ${
        requests.length
          ? requests.map(request => `
              <article class="admin-row"
                style="display:block;margin:12px 0;padding:16px;">

                <strong>Membership request</strong>

                <p>
                  Member ID:
                  ${escape(request.user_id)}
                </p>

                ${details(request)}

              </article>
            `).join("")
          : `<p class="muted">No Community requests found.</p>`
      }

      <hr style="margin:24px 0;">

      <h3>Community FBK submissions (${submissions.length})</h3>

      ${
        submissions.length
          ? submissions.map(item => {
              const status = String(item.status || "").toLowerCase();
              const alreadyReviewed = reviewed(status);

              return `
                <article class="admin-row"
                  style="display:block;margin:12px 0;padding:16px;">

                  <strong>New Community FBK</strong>

                  <p>
                    Member ID:
                    ${escape(item.user_id)}
                  </p>

                  ${details(item)}

                  ${
                    alreadyReviewed
                      ? `<p><strong>Review status:</strong> ${escape(status)}</p>`
                      : `
                        <div class="admin-actions">
                          <button
                            class="btn btn-gold"
                            data-review-community-fbk="${escape(item.id)}"
                            data-action="approve">
                            Approve after payment confirmation
                          </button>

                          <button
                            class="btn btn-outline"
                            data-review-community-fbk="${escape(item.id)}"
                            data-action="reject">
                            Reject FBK
                          </button>
                        </div>
                      `
                  }
                </article>
              `;
            }).join("")
          : `<p class="muted">No Community FBK submissions found.</p>`
      }
    `;
  };

  /* PRESERVE EXISTING ADMIN TABS */
  const originalLoadAdmin = SF.loadAdmin;

  SF.loadAdmin = async (tab = SF.adminTab || "notifications") => {
    if (tab !== "community") {
      return originalLoadAdmin(tab);
    }

    const box = document.getElementById("adminContent");
    if (!box) return;

    if (!SF.currentUser || !(await SF.checkAdmin())) {
      box.innerHTML = "<p>Administrator access is required.</p>";
      return;
    }

    SF.adminTab = "community";
    box.innerHTML = '<p class="muted">Loading Community records…</p>';

    try {
      const content = await SF.adminCommunity();

      box.innerHTML = SF.adminTabs() + content;
      SF.adminBindActions(box);

    } catch (error) {
      box.innerHTML = SF.adminTabs() +
        `<p class="form-message">${SF.adminEscape(error.message)}</p>`;
    }
  };

  /* ADD COMMUNITY REVIEW BUTTONS */
  const originalBindActions = SF.adminBindActions;

  SF.adminBindActions = box => {
    originalBindActions(box);

    box.querySelectorAll("[data-review-community-fbk]")
      .forEach(button => {
        button.addEventListener("click", async () => {
          const id = button.dataset.reviewCommunityFbk;
          const approve = button.dataset.action === "approve";

          let note = null;

          if (approve) {
            if (!confirm(
              "Have you personally confirmed that this member paid KES 200? Approve Community access?"
            )) return;
          } else {
            note = prompt("Enter the reason for rejecting this FBK:");

            if (note === null) return;

            note = note.trim();

            if (!note) {
              SF.showToast("Please enter a rejection reason.");
              return;
            }
          }

          button.disabled = true;

          try {
            const { data, error } = await SF.getClient().rpc(
              "sf_review_community_fbk",
              {
                p_submission_id: id,
                p_approve: approve,
                p_admin_note: note
              }
            );

            if (error) throw error;

            if (data?.success === false) {
              throw new Error(data.message || "Community review failed.");
            }

            SF.showToast(
              approve
                ? "Community member approved."
                : "Community FBK rejected."
            );

            await SF.loadAdmin("community");

          } catch (error) {
            button.disabled = false;
            SF.showToast(error.message);
          }
        });
      });
  };

})();
