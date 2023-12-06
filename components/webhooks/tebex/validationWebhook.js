module.exports = function handle(webhookData, req, res) {
    res.status(200).json({ id: webhookData.id });
};
  