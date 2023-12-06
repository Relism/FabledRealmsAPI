const express = require("express");
const router = express.Router();
const allowedIPs = ["18.209.80.3", "54.87.231.232"];

const tebexWebhookTypes = {
    "payment.completed": require("./webhooks/tebex/paymentCompleted"),
    "payment.declined": require("./webhooks/tebex/paymentDeclined"),
    "payment.refunded": require("./webhooks/tebex/paymentRefunded"),
    "payment.dispute.opened": require("./webhooks/tebex/paymentDisputeOpened"),
    "payment.dispute.won": require("./webhooks/tebex/paymentDisputeWon"),
    "payment.dispute.lost": require("./webhooks/tebex/paymentDisputeLost"),
    "payment.dispute.closed": require("./webhooks/tebex/paymentDisputeClosed"),
    "recurring-payment.started": require("./webhooks/tebex/recurringPaymentStarted"),
    "recurring-payment.renewed": require("./webhooks/tebex/recurringPaymentRenewed"),
    "recurring-payment.ended": require("./webhooks/tebex/recurringPaymentEnded"),
    "recurring-payment.status-changed": require("./webhooks/tebex/recurringPaymentStatusChanged"),
    "validation.webhook": require("./webhooks/tebex/validationWebhook"),
  };
  

router.post("/tebex", (req, res) => {
  const webhookData = req.body;
  const ip = getIp(req);

  if (!allowedIPs.includes(ip)) {
    console.log("Foreign ip: " + ip);
    res.status(404).send("Not Found");
    return;
  }

  const handle =
    tebexWebhookTypes[webhookData.type] ||
    ((data, req, res) => {
      console.log("Unknown tebex webhook type: " + data.type);
    });

  handle(webhookData, req, res);
  
});

function getIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  return forwardedFor
    ? forwardedFor.split(",").shift()
    : req.connection.remoteAddress;
}

module.exports = router;
