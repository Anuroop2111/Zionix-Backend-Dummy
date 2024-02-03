module.exports = {
    port: process.env.PORT || 3013,
    batchSize: process.env.BATCH_SIZE || 1,
    texasAccessKeyURL: process.env.TI_ACCESS_URL || "https://transact.ti.com/v1/oauth/accesstoken",
    texasVersion: process.env.TI_VERSION || "2",
    elementAPI: process.env.ELEMENT14_API || "8a3y3yysk73xw9c8u2wc8xpf",
    mouserAPI: process.env.MOUSER_API || "e9838601-8de5-44be-855a-7e44ddd6cd08",
    mouserVersion: process.env.MOSUER_VERSION || "1",
    fixerConversionKEY: process.env.FIXER_API || "dcf07bf2789b24860141ba3a2f23743f"
  };
  