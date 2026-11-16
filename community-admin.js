
/* SHOPY FONT — DIRECT COMMUNITY ADMIN */
(() => {
  "use strict";

  window.SF = window.SF || {};
  const SF = window.SF;

  if (!SF.adminTabs || !SF.loadAdmin || !SF.adminBindActions) {
    console.error("Community Admin: admin.js must load first.");
    return;
  }

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

  SF.adminCommunity = async () => {
    const db = SF.getClient();

    const { data, error } = await db
      .from("sf_community_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const requests = data || [];
    const escape = value =>
      SF.adminEscape(value ?? "Not available");

    const details = request =>
      Object.entries(request)
        .filter(([key]) => !["id", "user_id"].includes(key))
        .map(([key, value]) => `
          <p style="margin:5px 0;">
            <strong>${escape(key.replaceAll("_", " "))}:</strong>
            ${escape(
              value && typeof value === "object"
                ? JSON.stringify(value)
                : value
            )}
          </p>
        `).join("");

    const pending = requests.filter(
      r => r.status === "under_review"
    ).length;

    return `
      <h2>Community management</h2>

      <p class="muted">
        Community entry fee: KES 200.
        Confirm receipt of payment manually before approving.
        No FBK submission is required.
      </p>

      <h3>Community requests (${requests.length})</h3>
      <p class="muted">Awaiting review: ${pending}</p>

      ${
        requests.length
          ? requests.map(request => {
              const status = String(
                request.status || ""
              ).toLowerCase();

              const canReview = status === "under_review";

              return `
                <article class="admin-row"
                  style="display:block;margin:12px 0;padding:16px;">

                  <strong>Community membership request</strong>

                  <p>
                    <strong>Member ID:</strong>
                    ${escape(request.user_id)}
                  </p>

                  ${details(request)}

                  <p>
                    <strong>Review status:</strong>
                    ${escape(status)}
                  </p>

                  ${
                    canReview
                      ? `
                        <div class="admin-actions">
                          <button class="btn btn-gold"
                            data-review-community-request="${escape(request.id)}"
                            data-decision="approved">
                            Approve Community
                          </button>

                          <button class="btn btn-outline"
                            data-review-community-request="${escape(request.id)}"
                            data-decision="rejected">
                            Reject request
                          </button>
                        </div>
                      `
                      : ""
                  }
                </article>
              `;
            }).join("")
          : `<p class="muted">No Community requests found.</p>`
      }
    `;
  };

  const originalLoadAdmin = SF.loadAdmin;

  SF.loadAdmin = async (
    tab = SF.adminTab || "notifications"
  ) => {
    if (tab !== "community") {
      return originalLoadAdmin(tab);
    }

    const box = document.getElementById("adminContent");
    if (!box) return;

    if (!SF.currentUser || !(await SF.checkAdmin())) {
      box.innerHTML =
        "<p>Administrator access is required.</p>";
      return;
    }

    SF.adminTab = "community";
    box.innerHTML =
      '<p class="muted">Loading Community requests…</p>';

    try {
      const content = await SF.adminCommunity();

      box.innerHTML = SF.adminTabs() + content;
      SF.adminBindActions(box);

    } catch (error) {
      box.innerHTML = SF.adminTabs() +
        `<p class="form-message">${SF.adminEscape(error.message)}</p>`;
    }
  };

  const originalBindActions = SF.adminBindActions;

  SF.adminBindActions = box => {
    originalBindActions(box);

    box.querySelectorAll(
      "[data-review-community-request]"
    ).forEach(button => {
      button.addEventListener("click", async () => {
        const requestId =
          button.dataset.reviewCommunityRequest;

        const decision = button.dataset.decision;
        let note = null;

        if (decision === "approved") {
          if (!confirm(
            "Have you personally confirmed receipt of KES 200? Approve this Community member?"
          )) return;

        } else {
          note = prompt(
            "Enter the reason for rejecting this Community request:"
          );

          if (note === null) return;

          note = note.trim();

          if (note.length < 3) {
            SF.showToast(
              "Please enter a rejection reason of at least 3 characters."
            );
            return;
          }
        }

        button.disabled = true;

        try {
          const { data, error } =
            await SF.getClient().rpc(
              "sf_admin_review_community_request",
              {
                p_request_id: requestId,
                p_decision: decision,
                p_admin_note: note
              }
            );

          if (error) throw error;

          if (data?.success !== true) {
            throw new Error(
              data?.message || "Community review failed."
            );
          }

          SF.showToast(
            decision === "approved"
              ? "Community member approved. Referral reward processed if eligible."
              : "Community request rejected."
          );

          await SF.loadAdmin("community");

        } catch (error) {
          button.disabled = false;
          SF.showToast(
            error.message || "Community review failed."
          );
        }
      });
    });
  };

})();
                             
