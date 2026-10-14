sap.ui.define([
  "sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
  "use strict";

  return {
    /**
     * Formats currency amounts in South African Rand (R)
     */
    formatCurrency: function (fValue, sCurrency) {
      if (fValue === undefined || fValue === null || isNaN(fValue)) {
        return "R 0.00";
      }
      var oCurrencyFormat = NumberFormat.getCurrencyInstance({
        currencyCode: false,
        customCurrencies: {
          "ZAR": {
            symbol: "R",
            decimals: 2
          }
        }
      });
      var sFormatted = oCurrencyFormat.format(fValue, "ZAR");
      return "R " + sFormatted.replace("ZAR", "").trim();
    },

    /**
     * Maps address status to ValueState for ObjectStatus / ObjectMarker
     */
    addressStatusState: function (sStatus) {
      switch (sStatus) {
        case "EXISTING":
          return "Success";
        case "MODIFIED":
          return "Warning";
        case "NEW":
          return "Information";
        case "VERIFIED":
          return "Information";
        case "USED BEFORE":
          return "None";
        default:
          return "None";
      }
    },

    /**
     * Returns true if status is EXISTING
     */
    isExistingStatus: function (sStatus) {
      return sStatus === "EXISTING";
    },

    /**
     * Quantity multiplier string for display
     */
    formatQtyMultiplier: function (nQty, fPrice) {
      if (!nQty || !fPrice) return "";
      return nQty + " × " + this.formatCurrency(fPrice);
    }
  };
});
