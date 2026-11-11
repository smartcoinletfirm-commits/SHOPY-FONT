
/* =====================================================
   SHOPY FONT — ADMIN MEMBER CONTROLS
   Approve | Reject | Payment Return | Suspend | Restore
   ===================================================== */

(function () {
  "use strict";

  const SF = window.SF;

  if (!SF) {
    console.error("SHOPY FONT: SF application object not found.");
    return;
  }

  const ACTIONS = {
    approve: {
      label: "Approve",
      profileStatus: "approved",
      requestStatus: "approved",
      confirm: "Approve this member?"
    },
    reject: {
      label: "Reject",
      profileStatus: "rejected",
      requestStatus: "rejected",
      confirm: "Reject this member?"
    },
    payment: {
      label: "Move back to payment page",
      profileStatus: "awaiting_activation",
      confirm: "Return this member to the payment/FBK page?"
    },
    suspend: {
      label: "Suspend",
      profileStatus: "suspended",
      requestStatus: "suspended",
      confirm: "Suspend this member?"
    },
    restore: {
      label: "Restore",
      profileStatus: "approved",
      requestStatus: "approved",
      confirm: "Restore this member?"
    }
  };

  function client() {
    return SF.supabase || window.supabaseClient;
  }

  function notify(message, error = false) {
    if (typeof SF.toast === "function") {
      SF.toast(message, error ? "error" : "success");
    } else {
      alert(message);
    }
  }

  async function verifyAdmin() {
    if (typeof SF.checkAdmin === "function") {
      return await SF.checkAdmin();
    }

    const db = client();
    if (!db) throw new Error("Supabase connection unavailable.");

    const { data, error } = await db.rpc("scf_is_admin");
    if (error) throw error;
    if (!data) throw new Error("Administrator access required.");

    return true;
  }

  async function performAction(userId, action) {
    const config = ACTIONS[action];
    if (!config || !userId) return;

    if (!confirm(config.confirm)) return;

    const db = client();
    if (!db) {
      notify("Supabase connection unavailable.", true);
      return;
    }

    try {
      await verifyAdmin();

      const { error: profileError } = await db
        .from("profiles")
        .update({
          account_status: config.profileStatus
        })
        .eq("id", userId);

      if (profileError) throw profileError;

      if (config.requestStatus) {
        const { data: requests, error: requestReadError } = await db
          .from("activation_requests")
          .select("id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (requestReadError) throw requestReadError;

        if (requests && requests.length) {
          const { error: requestUpdateError } = await db
            .from("activation_requests")
            .update({ status: config.requestStatus })
            .eq("id", requests[0].id);

          if (requestUpdateError) throw requestUpdateError;
        }
      }

      if (action === "payment") {
        const { data: payments, error: paymentReadError } = await db
          .from("payment_submissions")
          .select("id,status")
          .eq("user_id", userId)
          .order("submitted_at", { ascending: false })
          .limit(1);

        if (paymentReadError) throw paymentReadError;

        if (payments && payments.length) {
          const payment = payments[0];

          if (
            ["submitted", "under_review", "approved"].includes(
              payment.status
            )
          ) {
            const { error: paymentError } = await db
              .from("payment_submissions")
              .update({
                status: "rejected",
                review_reason:
                  "Returned to payment step by administrator.",
                reviewed_at: new Date().toISOString()
              })
              .eq("id", payment.id);

            if (paymentError) throw paymentError;
          }
        }
      }

      notify(config.label + " action completed.");

      if (typeof SF.loadAdmin === "function") {
        await SF.loadAdmin();
      } else {
        location.reload();
      }

    } catch (error) {
      console.error("SHOPY admin action failed:", error);
      notify(error.message || "Action failed. Check permissions and database.", true);
    }
  }

  function addControls() {
    document.querySelectorAll("[data-edit-member]").forEach(form => {
      if (form.querySelector(".sf-admin-controls")) return;

      const userId =
        form.dataset.userId ||
        form.querySelector('[name="user_id"]')?.value ||
        form.querySelector('[name="id"]')?.value;

      if (!userId) return;

      const panel = document.createElement("div");
      panel.className = "sf-admin-controls";
      panel.style.cssText =
        "display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;";

      Object.entries(ACTIONS).forEach(([action, config]) => {
        const button = document.createElement("button");

        button.type = "button";
        button.textContent = config.label;
        button.dataset.sfAdminAction = action;

        button.style.cssText = `
          border:0;
          border-radius:8px;
          padding:10px 13px;
          cursor:pointer;
          font-weight:600;
          color:white;
          background:${
            action === "approve" || action === "restore"
              ? "#15803d"
              : action === "reject" || action === "suspend"
              ? "#b91c1c"
              : "#2563eb"
          };
        `;

        button.addEventListener("click", () => {
          performAction(userId, action);
        });

        panel.appendChild(button);
      });

      form.appendChild(panel);
    });
  }

  window.SHOPY_ADMIN_CONTROLS = {
    performAction,
    addControls
  };

  document.addEventListener("DOMContentLoaded", addControls);

  const observer = new MutationObserver(addControls);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log("SHOPY FONT admin controls loaded.");
})();
    
