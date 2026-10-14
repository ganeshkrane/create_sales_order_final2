sap.ui.define([
  "sap/ui/salesorder/store/controller/BaseController",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/salesorder/store/model/models"
], function (BaseController, JSONModel, Fragment, MessageToast, MessageBox, Filter, FilterOperator, models) {
  "use strict";

  return BaseController.extend("sap.ui.salesorder.store.controller.CustomerWizard", {
    onInit: function () {
      var oWizardModel = new JSONModel({
        searchPanelExpanded: true,
        showNewCustomerCapture: false,
        isCreatingNewCustomer: false,
        newCustomerTypeIndex: 0,
        searchCriteria: {
          customerName: "",
          mobile: "",
          email: ""
        },
        productSearchQuery: "",
        selectedCategory: "All",
        orderCreated: false
      });
      this.getView().setModel(oWizardModel, "wizardModel");

      // Ensure pricing is initialized
      this.recalculateTotals();
      this._updatePendingActionText();
      this._sCurrentLang = "en";
    },

    onToggleLanguage: function () {
      this._sCurrentLang = (this._sCurrentLang === "en") ? "de" : "en";
      sap.ui.getCore().getConfiguration().setLanguage(this._sCurrentLang);
      var sMsg = this._sCurrentLang === "de"
        ? "Sprache gewechselt zu Deutsch (DE)"
        : "Language switched to English (EN)";
      MessageToast.show(sMsg);
    },

    // ========================================================
    // STEP 1: CUSTOMER LOOKUP & CAPTURE
    // ========================================================
    onSearchCustomerClick: function () {
      var oWizardModel = this.getView().getModel("wizardModel");
      var oCriteria = oWizardModel.getProperty("/searchCriteria") || {};
      var sName = (oCriteria.customerName || "").trim();
      var sMobile = (oCriteria.mobile || "").trim();
      var sEmail = (oCriteria.email || "").trim();

      // No validation required: if no criteria provided, display all customer records
      this.getModel("appState").setProperty("/searchFilterValue", sName);
      this._openSearchResultsDialog(sName, sMobile, sEmail);
    },

    _openSearchResultsDialog: function (sName, sMobile, sEmail) {
      var oView = this.getView();
      var that = this;

      if (!this._pResultsDialog) {
        this._pResultsDialog = Fragment.load({
          id: oView.getId(),
          name: "sap.ui.salesorder.store.view.fragments.CustomerSearchResultsDialog",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }

      this._pResultsDialog.then(function (oDialog) {
        var oTable = Fragment.byId(oView.getId(), "customerResultsTable");
        var oBinding = oTable.getBinding("items");
        var aFilters = [];

        if (sName) {
          aFilters.push(new Filter("name", FilterOperator.Contains, sName));
        }
        if (sMobile) {
          aFilters.push(new Filter("telephone", FilterOperator.Contains, sMobile));
        }
        if (sEmail) {
          aFilters.push(new Filter("email", FilterOperator.Contains, sEmail));
        }

        if (aFilters.length > 0) {
          oBinding.filter(new Filter({ filters: aFilters, and: false }));
        } else {
          // If no search criteria provided, display all data
          oBinding.filter([]);
        }

        var aItems = oTable.getItems();
        if (aItems.length > 0) {
          oTable.setSelectedItem(aItems[0]);
          that._selectedCustomerContext = aItems[0].getBindingContext("customers");
        } else {
          that._selectedCustomerContext = null;
        }
        oDialog.open();
      });
    },

    onSelectCustomerRow: function (oEvent) {
      var oListItem = oEvent.getParameter("listItem");
      this._selectedCustomerContext = oListItem.getBindingContext("customers");
    },

    onLiveSearchDialog: function (oEvent) {
      var sValue = oEvent.getParameter("value");
      var oTable = Fragment.byId(this.getView().getId(), "customerResultsTable");
      var oBinding = oTable.getBinding("items");

      if (sValue) {
        var aFilters = [
          new Filter("name", FilterOperator.Contains, sValue),
          new Filter("bpNumber", FilterOperator.Contains, sValue),
          new Filter("telephone", FilterOperator.Contains, sValue),
          new Filter("email", FilterOperator.Contains, sValue)
        ];
        oBinding.filter(new Filter({ filters: aFilters, and: false }));
      } else {
        oBinding.filter([]);
      }
    },

    onConfirmCustomerSelection: function () {
      if (!this._selectedCustomerContext) {
        var oTable = Fragment.byId(this.getView().getId(), "customerResultsTable");
        var aItems = oTable.getItems();
        if (aItems.length > 0) {
          this._selectedCustomerContext = aItems[0].getBindingContext("customers");
        }
      }

      if (this._selectedCustomerContext) {
        var oCustomerData = this._selectedCustomerContext.getObject();
        var oAppState = this.getModel("appState");
        oAppState.setProperty("/customer", JSON.parse(JSON.stringify(oCustomerData)));
        oAppState.setProperty("/orderHeader/soldToParty", oCustomerData.bpNumber + " - " + oCustomerData.name);
        oAppState.setProperty("/orderHeader/shipToParty", oCustomerData.bpNumber + " - " + oCustomerData.name);
        oAppState.setProperty("/delivery/address", oCustomerData.address);
        MessageToast.show("Customer " + oCustomerData.name + " (BP " + oCustomerData.bpNumber + ") loaded");
      }

      this.onCloseSearchResultsDialog();
      this.getView().getModel("wizardModel").setProperty("/showNewCustomerCapture", false);
      this.getView().getModel("wizardModel").setProperty("/isCreatingNewCustomer", false);
    },

    onCustomerNotFound: function () {
      this.onCloseSearchResultsDialog();
      this.onShowCustomerNotFoundCapture();
    },

    onCloseSearchResultsDialog: function () {
      if (this._pResultsDialog) {
        this._pResultsDialog.then(function (oDialog) {
          oDialog.close();
        });
      }
    },

    onClearSearchCriteria: function () {
      this.getView().getModel("wizardModel").setProperty("/searchCriteria", {
        customerName: "",
        mobile: "",
        email: ""
      });
    },

    onShowCustomerNotFoundCapture: function () {
      var oWizardModel = this.getView().getModel("wizardModel");
      oWizardModel.setProperty("/isCreatingNewCustomer", true);
      oWizardModel.setProperty("/showNewCustomerCapture", false);

      var oAppState = this.getModel("appState");
      var oCriteria = oWizardModel.getProperty("/searchCriteria") || {};
      var sCriteriaName = (oCriteria.customerName || "").trim();
      var aNames = sCriteriaName.split(" ");
      var sFirst = aNames[0] || "";
      var sLast = aNames.slice(1).join(" ") || "";
      var sShellBp = "10002" + Math.floor(10000 + Math.random() * 90000);

      var oDraft = {
        bpNumber: sShellBp,
        name: sCriteriaName || "New Customer",
        firstName: sFirst,
        lastName: sLast,
        title: "Mr.",
        telephone: oCriteria.mobile || "",
        email: oCriteria.email || "",
        type: "Individual",
        dateOfBirth: "",
        gender: "Male",
        idType: "SA ID Number",
        idPassport: oCriteria.idNumber || "",
        companyName: sCriteriaName || "",
        regNo: "",
        vatNo: "",
        authRepTitle: "Mr.",
        authRepFirstName: sFirst,
        authRepSurname: sLast,
        contactPerson: sCriteriaName || "",
        language: "English",
        salesOrg: "1000",
        distChannel: "10",
        division: "00",
        address: {
          street: "12 Rivonia Road",
          city: "Sandton",
          postalCode: "2196",
          region: "Gauteng",
          country: "ZA",
          formatted: "12 Rivonia Road, Sandton, 2196, Gauteng",
          type: "Default / Billing",
          status: "NEW",
          statusState: "Information"
        }
      };

      oAppState.setProperty("/customer", oDraft);
      oAppState.setProperty("/orderHeader/soldToParty", sShellBp + " - " + oDraft.name);
      oAppState.setProperty("/orderHeader/shipToParty", sShellBp + " - " + oDraft.name);
      MessageToast.show("Please enter Customer Basic Details");
    },

    onCancelNewCustomer: function () {
      var oWizardModel = this.getView().getModel("wizardModel");
      oWizardModel.setProperty("/showNewCustomerCapture", false);
      oWizardModel.setProperty("/isCreatingNewCustomer", false);
      MessageToast.show("Cancelled new customer creation");
    },

    onSelectEntityTypeIndividual: function () {
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/customer/type", "Individual");
      this.onUpdateCustomerName();
    },

    onSelectEntityTypeCompany: function () {
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/customer/type", "Company");
      this.onUpdateCustomerName();
    },

    onUpdateCustomerName: function () {
      var oAppState = this.getModel("appState");
      var sType = oAppState.getProperty("/customer/type") || "Individual";
      var sBp = oAppState.getProperty("/customer/bpNumber") || ("10002" + Math.floor(10000 + Math.random() * 90000));
      if (!oAppState.getProperty("/customer/bpNumber")) {
        oAppState.setProperty("/customer/bpNumber", sBp);
      }

      var sName = "";
      if (sType === "Company") {
        sName = oAppState.getProperty("/customer/companyName") || "Company";
      } else {
        var sFirst = oAppState.getProperty("/customer/firstName") || "";
        var sLast = oAppState.getProperty("/customer/lastName") || "";
        sName = (sFirst + " " + sLast).trim() || "New Customer";
      }

      oAppState.setProperty("/customer/name", sName);
      oAppState.setProperty("/orderHeader/soldToParty", sBp + " - " + sName);
      oAppState.setProperty("/orderHeader/shipToParty", sBp + " - " + sName);
    },

    onNewCustomerTypeChange: function (oEvent) {
      var nIndex = oEvent.getParameter("selectedIndex");
      this.getView().getModel("wizardModel").setProperty("/newCustomerTypeIndex", nIndex);
      if (nIndex === 1) {
        this.onSelectEntityTypeCompany();
      } else {
        this.onSelectEntityTypeIndividual();
      }
    },

    onCreateShellBpConfirm: function () {
      this.onUpdateCustomerName();
      var oWizardModel = this.getView().getModel("wizardModel");
      oWizardModel.setProperty("/showNewCustomerCapture", false);
      oWizardModel.setProperty("/isCreatingNewCustomer", true);
      MessageToast.show("Basic Details ready for customer creation");
    },

    onUpdateFullName: function () {
      this.onUpdateCustomerName();
    },

    onUpdateCompanyName: function () {
      this.onUpdateCustomerName();
    },

    // ========================================================
    // STEP 2: ADDRESS VALIDATION
    // ========================================================
    onOpenAddressPluginModal: function () {
      var that = this;
      var oAppState = this.getModel("appState");

      this.openAddressValidationDialog("Default (Billing)", function (oSelectedAddress) {
        if (oSelectedAddress) {
          var oAddrObj = {
            street: oSelectedAddress.street || "",
            city: oSelectedAddress.city || "",
            postalCode: oSelectedAddress.postalCode || "",
            region: oSelectedAddress.region || "",
            formatted: oSelectedAddress.formatted || "",
            type: "Default / Billing",
            status: oSelectedAddress.status || "EXISTING",
            statusState: that.formatter.addressStatusState(oSelectedAddress.status)
          };
          oAppState.setProperty("/customer/address", oAddrObj);
          oAppState.setProperty("/delivery/address", oAddrObj);
          that._updatePendingActionText();
          MessageToast.show("Address validated: " + oAddrObj.status);
        }
      });
    },

    onSelectSuggestedAddress: function (oEvent) {
      var oItem = oEvent.getParameter("listItem");
      var oSelectedAddress = oItem.getBindingContext("addresses").getObject();
      var oAppState = this.getModel("appState");
      var that = this;

      var oAddrObj = {
        street: oSelectedAddress.street || "",
        city: oSelectedAddress.city || "",
        postalCode: oSelectedAddress.postalCode || "",
        region: oSelectedAddress.region || "",
        formatted: oSelectedAddress.formatted || "",
        type: "Default / Billing",
        status: oSelectedAddress.status || "EXISTING",
        statusState: that.formatter.addressStatusState(oSelectedAddress.status)
      };
      oAppState.setProperty("/customer/address", oAddrObj);
      oAppState.setProperty("/delivery/address", oAddrObj);
      this._updatePendingActionText();
      MessageToast.show("Selected: " + oAddrObj.formatted);
    },

    onEnterNewAddressInWizard: function () {
      var oAddressesModel = this.getModel("addresses");
      var aAddresses = oAddressesModel.getData() || [];
      var oNewAddr = {
        id: "addr-" + (aAddresses.length + 1),
        street: "88 Grayston Drive",
        city: "Sandton",
        postalCode: "2196",
        region: "Gauteng",
        country: "South Africa",
        formatted: "88 Grayston Drive, Sandton, 2196, Gauteng",
        status: "NEW",
        statusState: "Information",
        note: "Newly entered customer address",
        isDefault: true
      };
      aAddresses.unshift(oNewAddr);
      oAddressesModel.setData(aAddresses);
      this.getModel("appState").setProperty("/customer/address", oNewAddr);
      this._updatePendingActionText();
      MessageToast.show("New address entered (Status: NEW)");
    },

    onEditAddressInWizard: function () {
      var oAddressesModel = this.getModel("addresses");
      var aAddresses = oAddressesModel.getData() || [];
      if (aAddresses.length > 0) {
        aAddresses[0].street = "12 Rivonia Road, Suite 402";
        aAddresses[0].formatted = "12 Rivonia Road, Suite 402, Sandton, 2196, Gauteng";
        aAddresses[0].status = "MODIFIED";
        aAddresses[0].statusState = "Warning";
        aAddresses[0].note = "Modified by agent: Suite number added";
        oAddressesModel.setData(aAddresses);
        this.getModel("appState").setProperty("/customer/address", aAddresses[0]);
        this._updatePendingActionText();
        MessageToast.show("Address modified (Status: MODIFIED)");
      }
    },

    // ========================================================
    // STEP 4: ORDER TYPE
    // ========================================================
    onOrderTypeChange: function (oEvent) {
      var sKey = oEvent.getParameter("selectedItem").getKey();
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/orderHeader/orderType", sKey);
      if (sKey === "ZOR") {
        oAppState.setProperty("/orderHeader/orderTypeName", "Standard Store Order");
        oAppState.setProperty("/orderHeader/orderTypeDesc", "ZOR · Take-away / collect today");
      } else if (sKey === "ZDL") {
        oAppState.setProperty("/orderHeader/orderTypeName", "Delivery Order");
        oAppState.setProperty("/orderHeader/orderTypeDesc", "ZDL · Deliver to customer");
      } else if (sKey === "ZSP") {
        oAppState.setProperty("/orderHeader/orderTypeName", "Special / Supply Order");
        oAppState.setProperty("/orderHeader/orderTypeDesc", "ZSP · Warehouse Supply");
      }
    },

    onSelectOrderTypeZOR: function () {
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/orderHeader/orderType", "ZOR");
      oAppState.setProperty("/orderHeader/orderTypeName", "Standard Store Order");
      oAppState.setProperty("/orderHeader/orderTypeDesc", "ZOR · Take-away / collect today");
    },

    onSelectOrderTypeZDL: function () {
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/orderHeader/orderType", "ZDL");
      oAppState.setProperty("/orderHeader/orderTypeName", "Delivery Order");
      oAppState.setProperty("/orderHeader/orderTypeDesc", "ZDL · Deliver to customer");
    },

    onSelectOrderTypeZSP: function () {
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/orderHeader/orderType", "ZSP");
      oAppState.setProperty("/orderHeader/orderTypeName", "Special / Supply Order");
      oAppState.setProperty("/orderHeader/orderTypeDesc", "ZSP · Warehouse Supply");
    },

    // ========================================================
    // STEP 5: PRODUCTS & CART
    // ========================================================
    onLiveSearchProducts: function () {
      this._applyProductFilters();
    },

    onCategoryFilterChange: function () {
      this._applyProductFilters();
    },

    _applyProductFilters: function () {
      var oWizardModel = this.getView().getModel("wizardModel");
      var sQuery = (oWizardModel.getProperty("/productSearchQuery") || "").trim();
      var sCategory = oWizardModel.getProperty("/selectedCategory");
      var aFilters = [];

      if (sQuery) {
        aFilters.push(new Filter({
          filters: [
            new Filter("name", FilterOperator.Contains, sQuery),
            new Filter("articleId", FilterOperator.Contains, sQuery)
          ],
          and: false
        }));
      }

      if (sCategory && sCategory !== "All") {
        aFilters.push(new Filter("category", FilterOperator.EQ, sCategory));
      }

      var oTable = this.byId("wizardProductsTable");
      if (oTable) {
        var oBinding = oTable.getBinding("items");
        if (oBinding) oBinding.filter(aFilters);
      }
    },

    onAddToCartFromCatalog: function (oEvent) {
      var oButton = oEvent.getSource();
      var oProduct = oButton.getBindingContext("products").getObject();
      var oAppState = this.getModel("appState");
      var aCart = oAppState.getProperty("/cart") || [];

      var oExisting = null;
      for (var i = 0; i < aCart.length; i++) {
        if (aCart[i].articleId === oProduct.articleId && !aCart[i].isSubItem) {
          oExisting = aCart[i];
          break;
        }
      }

      if (oExisting) {
        oExisting.qty += 1;
        oExisting.netValue = +(oExisting.qty * oExisting.netPrice).toFixed(2);
      } else {
        var nItemNo = (aCart.filter(function(it){ return !it.isSubItem; }).length + 1) * 10;
        var oNewItem = {
          item: String(nItemNo),
          articleId: oProduct.articleId,
          name: oProduct.name,
          qty: 1,
          itemCat: "TAN",
          netPrice: oProduct.price,
          discountPct: 0,
          hasCondition: false,
          conditionText: "",
          netValue: oProduct.price,
          isSubItem: false
        };
        aCart.push(oNewItem);

        // Auto-propose value added items (Screen 10 mockup)
        if (oProduct.hasEgp) {
          aCart.push({
            item: nItemNo + ".1",
            articleId: oProduct.egpArticle,
            name: oProduct.egpName,
            subText: "value-added to item " + nItemNo,
            qty: 1,
            itemCat: "ZSRV",
            netPrice: oProduct.egpPrice,
            discountPct: 0,
            hasCondition: false,
            conditionText: "",
            netValue: oProduct.egpPrice,
            isSubItem: true,
            parentItem: String(nItemNo)
          });
        } else if (oProduct.hasCover) {
          aCart.push({
            item: nItemNo + ".1",
            articleId: oProduct.coverArticle,
            name: oProduct.coverName,
            subText: "cover article",
            qty: 1,
            itemCat: "TAN",
            netPrice: oProduct.coverPrice,
            discountPct: 0,
            hasCondition: false,
            conditionText: "",
            netValue: oProduct.coverPrice,
            isSubItem: true,
            parentItem: String(nItemNo)
          });
        }
      }

      oAppState.setProperty("/cart", aCart);
      this.recalculateTotals();
      MessageToast.show(this.getText("addedToCartToast", [oProduct.name]));
    },

    onIncreaseQty: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      var oItem = oContext.getObject();
      oItem.qty = (oItem.qty || 1) + 1;

      var oAppState = this.getModel("appState");
      var aCart = oAppState.getProperty("/cart") || [];
      if (!oItem.isSubItem) {
        aCart.forEach(function (sub) {
          if (sub.isSubItem && sub.parentItem === oItem.item) {
            sub.qty = oItem.qty;
          }
        });
      }
      this.recalculateTotals();
    },

    onDecreaseQty: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      var oItem = oContext.getObject();
      if (oItem.qty > 1) {
        oItem.qty -= 1;
        var oAppState = this.getModel("appState");
        var aCart = oAppState.getProperty("/cart") || [];
        if (!oItem.isSubItem) {
          aCart.forEach(function (sub) {
            if (sub.isSubItem && sub.parentItem === oItem.item) {
              sub.qty = oItem.qty;
            }
          });
        }
        this.recalculateTotals();
      }
    },

    onOpenAddCondition: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      var oItem = oContext.getObject();
      var that = this;

      MessageBox.confirm("Apply promotional discount to '" + oItem.name + "'?\n\n- Campaign Discount: 10% off", {
        title: "Add Price Condition",
        actions: ["Apply 10% Discount", MessageBox.Action.CANCEL],
        emphasizedAction: "Apply 10% Discount",
        onClose: function (sAction) {
          if (sAction === "Apply 10% Discount") {
            oItem.hasCondition = true;
            oItem.discountPct = 10;
            oItem.conditionText = "Discount -10%";
            that.recalculateTotals();
            MessageToast.show("Condition added: -10% discount applied to item " + oItem.item);
          }
        }
      });
    },

    onRemoveCartItem: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      if (!oContext) {
        return;
      }
      var oItem = oContext.getObject();
      var oAppState = this.getModel("appState");
      var aCart = oAppState.getProperty("/cart") || [];
      var that = this;
      var sItemDesc = oItem.description || oItem.name || ("Item " + oItem.item);

      MessageBox.confirm("Are you sure you want to delete line item " + oItem.item + " (" + sItemDesc + ")?", {
        title: "Delete Line Item",
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.DELETE,
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.DELETE) {
            var aFiltered = aCart.filter(function (it) {
              return it.item !== oItem.item && it.parentItem !== oItem.item;
            });
            oAppState.setProperty("/cart", aFiltered);
            that.recalculateTotals();
            MessageToast.show("Line item " + oItem.item + " deleted from cart");
          }
        }
      });
    },

    onRejectionReasonChange: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      if (!oContext) {
        return;
      }
      var oItem = oContext.getObject();
      var sKey = oEvent.getParameter("selectedItem") ? oEvent.getParameter("selectedItem").getKey() : "";
      var sText = oEvent.getParameter("selectedItem") ? oEvent.getParameter("selectedItem").getText() : "";
      if (sKey && sKey !== "-") {
        MessageToast.show("Rejection reason set: " + sText + " for Item " + oItem.item);
      } else {
        MessageToast.show("Rejection reason cleared for Item " + oItem.item);
      }
    },

    onCartTabSelect: function (oEvent) {
      var sKey = oEvent.getParameter("key") || oEvent.getSource().getSelectedKey();
      this.getModel("appState").setProperty("/cartTab", sKey);
    },

    onAddConditionRow: function () {
      var oAppState = this.getModel("appState");
      var aConditions = oAppState.getProperty("/conditions") || [];
      aConditions.push({
        id: "cond-" + Date.now(),
        conditionType: "",
        amount: "",
        per: "1 EA",
        value: ""
      });
      oAppState.setProperty("/conditions", aConditions);
      MessageToast.show("New condition row added");
    },

    onDeleteConditionRow: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      if (!oContext) {
        return;
      }
      var sPath = oContext.getPath();
      var iIndex = parseInt(sPath.split("/").pop(), 10);
      var oAppState = this.getModel("appState");
      var aConditions = oAppState.getProperty("/conditions") || [];
      aConditions.splice(iIndex, 1);
      oAppState.setProperty("/conditions", aConditions);
      MessageToast.show("Condition row deleted");
    },

    // ========================================================
    // VALUE-ADD POPUP & ADD-ON SELECTION
    // ========================================================
    onOpenValueAddPopup: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext("appState");
      this._selectedParentCartItem = oContext ? oContext.getObject() : null;
      var sMainArticle = (this._selectedParentCartItem && this._selectedParentCartItem.articleId) || "HT-1000";

      // Products from user screenshot
      var aAddonProducts = [
        { mainArticle: sMainArticle, addonArticle: "AD-1001", description: "Extended Warranty - 1 Year", price: "49.99" },
        { mainArticle: sMainArticle, addonArticle: "AD-1002", description: "Protective Carry Case", price: "24.5" },
        { mainArticle: sMainArticle, addonArticle: "AD-1003", description: "Wireless Charging Station", price: "79" },
        { mainArticle: sMainArticle, addonArticle: "AD-1004", description: "Premium Support Package", price: "99.99" },
        { mainArticle: sMainArticle, addonArticle: "AD-1005", description: "Replacement Power Adapter", price: "19.95" }
      ];

      var oValueAddModel = this.getView().getModel("valueAddModel");
      if (!oValueAddModel) {
        oValueAddModel = new JSONModel({ items: aAddonProducts, allItems: aAddonProducts });
        this.getView().setModel(oValueAddModel, "valueAddModel");
      } else {
        oValueAddModel.setProperty("/items", aAddonProducts);
        oValueAddModel.setProperty("/allItems", aAddonProducts);
      }

      var oView = this.getView();
      var that = this;

      if (!this._pValueAddDialog) {
        this._pValueAddDialog = Fragment.load({
          id: oView.getId(),
          name: "sap.ui.salesorder.store.view.fragments.ValueAddDialog",
          controller: this
        }).then(function (oDialog) {
          oView.addDependent(oDialog);
          return oDialog;
        });
      }

      this._pValueAddDialog.then(function (oDialog) {
        var oTable = Fragment.byId(oView.getId(), "valueAddTable");
        if (oTable) {
          oTable.removeSelections(true);
        }
        var oSearchField = Fragment.byId(oView.getId(), "valueAddSearchField");
        if (oSearchField) {
          oSearchField.setValue("");
        }
        oDialog.open();
      });
    },

    onLiveSearchValueAdd: function (oEvent) {
      var sValue = (oEvent.getParameter("newValue") || "").toLowerCase().trim();
      var oModel = this.getView().getModel("valueAddModel");
      var aAll = oModel.getProperty("/allItems") || [];
      if (!sValue) {
        oModel.setProperty("/items", aAll);
      } else {
        var aFiltered = aAll.filter(function (it) {
          return it.addonArticle.toLowerCase().indexOf(sValue) !== -1 ||
                 it.description.toLowerCase().indexOf(sValue) !== -1 ||
                 it.mainArticle.toLowerCase().indexOf(sValue) !== -1;
        });
        oModel.setProperty("/items", aFiltered);
      }
    },

    onConfirmValueAddSelection: function () {
      var oView = this.getView();
      var oTable = Fragment.byId(oView.getId(), "valueAddTable");
      var aSelected = oTable ? oTable.getSelectedItems() : [];

      if (!aSelected || aSelected.length === 0) {
        MessageToast.show("Please select at least one add-on item.");
        return;
      }

      var oAppState = this.getModel("appState");
      var aCart = oAppState.getProperty("/cart") || [];
      var oParent = this._selectedParentCartItem;
      var sParentItem = oParent ? oParent.item : "10";
      var nParentQty = (oParent && oParent.qty) ? oParent.qty : 1;

      // Find highest sub-item index for this parent
      var nSubIndex = 1;
      aCart.forEach(function (it) {
        if (it.parentItem === sParentItem && it.item.indexOf(".") !== -1) {
          var nIdx = parseInt(it.item.split(".")[1], 10);
          if (!isNaN(nIdx) && nIdx >= nSubIndex) {
            nSubIndex = nIdx + 1;
          }
        }
      });

      // Find parent index in cart
      var nParentIndex = -1;
      for (var i = 0; i < aCart.length; i++) {
        if (aCart[i].item === sParentItem) {
          nParentIndex = i;
          break;
        }
      }

      var aNewItems = [];
      for (var j = 0; j < aSelected.length; j++) {
        var oAddon = aSelected[j].getBindingContext("valueAddModel").getObject();
        var sItemNum = sParentItem + "." + (nSubIndex++);
        var fPrice = parseFloat(oAddon.price) || 0;
        var fTotal = +(fPrice * nParentQty).toFixed(2);

        var oNewItem = {
          item: sItemNum,
          articleId: oAddon.addonArticle,
          targetQty: nParentQty,
          qty: nParentQty,
          um: "EA",
          description: oAddon.description,
          name: oAddon.description,
          productNo: "PRD-" + oAddon.addonArticle,
          valueAdds: "-",
          pricePerUnit: fPrice,
          netPrice: fPrice,
          itemPrice: fTotal,
          netValue: fTotal,
          salesPersonId: (oParent && oParent.salesPersonId) || "SP-1042",
          site: (oParent && oParent.site) || "S101",
          itemCat: "ZSRV",
          extendedGuarantee: oAddon.addonArticle.indexOf("1001") !== -1 ? oAddon.addonArticle : "-",
          rejReason: "-",
          discountPct: 0,
          hasCondition: false,
          conditionText: "",
          isSubItem: true,
          isValueAdd: true,
          parentItem: sParentItem
        };
        aNewItems.push(oNewItem);
      }

      // Insert directly after parent/existing sub-items
      if (nParentIndex !== -1) {
        var nInsertAt = nParentIndex + 1;
        while (nInsertAt < aCart.length && aCart[nInsertAt].parentItem === sParentItem) {
          nInsertAt++;
        }
        for (var k = 0; k < aNewItems.length; k++) {
          aCart.splice(nInsertAt + k, 0, aNewItems[k]);
        }
      } else {
        aNewItems.forEach(function (it) { aCart.push(it); });
      }

      oAppState.setProperty("/cart", aCart);
      this.recalculateTotals();

      if (this._pValueAddDialog) {
        this._pValueAddDialog.then(function (oDialog) {
          oDialog.close();
        });
      }

      MessageToast.show(aNewItems.length + " add-on item(s) added to cart");
    },

    onCloseValueAddDialog: function () {
      if (this._pValueAddDialog) {
        this._pValueAddDialog.then(function (oDialog) {
          oDialog.close();
        });
      }
    },

    // ========================================================
    // STEP 6: DELIVERY
    // ========================================================
    onSelectDeliveryMethodToCustomer: function () {
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/delivery/methodKey", "DELIVERY");
      oAppState.setProperty("/delivery/methodTitle", "Delivery to Customer");
    },

    onSelectInStoreCollection: function () {
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/delivery/methodKey", "COLLECTION");
      oAppState.setProperty("/delivery/methodTitle", "In-Store Collection");
    },

    onSelectWarehousePickup: function () {
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/delivery/methodKey", "WAREHOUSE");
      oAppState.setProperty("/delivery/methodTitle", "Warehouse Pickup");
    },

    onPayeeSelectChange: function (oEvent) {
      var oItem = oEvent.getParameter("selectedItem");
      if (oItem) {
        var sKey = oItem.getKey();
        var sText = oItem.getText();
        var oAppState = this.getModel("appState");
        oAppState.setProperty("/delivery/payee", sKey);
        oAppState.setProperty("/delivery/payeeText", sText);
        oAppState.setProperty("/review/shippingDetails/payee", sText);
      }
    },

    onShipToSelectChange: function (oEvent) {
      var oItem = oEvent.getParameter("selectedItem");
      if (!oItem) {
        return;
      }
      var sKey = oItem.getKey();
      var sText = oItem.getText();
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/delivery/shipTo", sKey);
      oAppState.setProperty("/delivery/shipToName", sText);
      oAppState.setProperty("/review/shippingDetails/shipTo", sText);

      var mAddresses = {
        "1000234571": {
          street: "12 Rivonia Road",
          city: "Sandton",
          state: "Gauteng",
          postalCode: "2196",
          country: "South Africa",
          phone: "+27 82 555 0192"
        },
        "1000234588": {
          street: "88 Sandton Drive",
          city: "Sandton",
          state: "Gauteng",
          postalCode: "2196",
          country: "South Africa",
          phone: "+27 11 884 9000"
        },
        "1000234599": {
          street: "50 Oxford Road",
          city: "Rosebank",
          state: "Gauteng",
          postalCode: "2196",
          country: "South Africa",
          phone: "+27 11 788 4321"
        }
      };

      if (mAddresses[sKey]) {
        oAppState.setProperty("/delivery/shipToAddress", mAddresses[sKey]);
        oAppState.setProperty("/review/shippingDetails/phoneNumber", mAddresses[sKey].phone);
      }
      MessageToast.show("Ship to updated: " + sText);
    },

    onBillToSelectChange: function (oEvent) {
      var oItem = oEvent.getParameter("selectedItem");
      if (!oItem) {
        return;
      }
      var sKey = oItem.getKey();
      var sText = oItem.getText();
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/delivery/billTo", sKey);
      oAppState.setProperty("/delivery/billToName", sText);
      oAppState.setProperty("/review/billingDetails/billTo", sText);
      MessageToast.show("Bill to updated: " + sText);
    },

    onRequestedDeliveryDateChange: function (oEvent) {
      var sValue = oEvent.getParameter("value");
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/delivery/requestedDeliveryDate", sValue);
      oAppState.setProperty("/review/shippingDetails/requestedDeliveryDate", sValue);
      MessageToast.show("Requested delivery date: " + sValue);
    },

    onSingleShipmentChange: function (oEvent) {
      var bState = oEvent.getParameter("state");
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/delivery/singleShipment", bState);
      oAppState.setProperty("/review/shippingDetails/singleShipment", bState ? "Yes" : "No");
      MessageToast.show("Single shipment: " + (bState ? "Yes" : "No"));
    },

    onCarrierChange: function (oEvent) {
      var oItem = oEvent.getParameter("selectedItem");
      if (oItem) {
        var sText = oItem.getText();
        var oAppState = this.getModel("appState");
        oAppState.setProperty("/delivery/carrier", sText);
        oAppState.setProperty("/review/shippingDetails/carrier", sText);
        MessageToast.show("Carrier selected: " + sText);
      }
    },

    onShippingMethodChange: function (oEvent) {
      var oItem = oEvent.getParameter("selectedItem");
      if (oItem) {
        var sText = oItem.getText();
        var oAppState = this.getModel("appState");
        oAppState.setProperty("/delivery/shipping", sText);
        oAppState.setProperty("/review/shippingDetails/shipping", sText);
        MessageToast.show("Shipping method: " + sText);
      }
    },

    onIncotermsChange: function (oEvent) {
      var oItem = oEvent.getParameter("selectedItem");
      if (oItem) {
        var sText = oItem.getText();
        var oAppState = this.getModel("appState");
        oAppState.setProperty("/delivery/incoterms", sText);
        oAppState.setProperty("/review/shippingDetails/incoterms", sText);
        MessageToast.show("Incoterms: " + sText);
      }
    },

    onFileSizeExceed: function (oEvent) {
      MessageBox.error("File size cannot exceed 2 MB. Please choose a smaller file.", {
        title: "File Size Limit Exceeded"
      });
      var oUploader = oEvent.getSource();
      if (oUploader && typeof oUploader.clear === "function") {
        oUploader.clear();
      }
    },

    onFileSelected: function (oEvent) {
      var oUploader = oEvent.getSource();
      var aFiles = oEvent.getParameter("files");
      var oFile = (aFiles && aFiles.length > 0)
        ? aFiles[0]
        : (oUploader.getDomRef && oUploader.getDomRef("fu") && oUploader.getDomRef("fu").files ? oUploader.getDomRef("fu").files[0] : null);

      if (!oFile) {
        return;
      }

      // 2MB size restriction (2 * 1024 * 1024 bytes)
      var MAX_SIZE = 2 * 1024 * 1024;
      if (oFile.size > MAX_SIZE) {
        var nSizeMb = (oFile.size / (1024 * 1024)).toFixed(2);
        MessageBox.error("File size exceeds 2MB limit. The selected file is " + nSizeMb + " MB.", {
          title: "File Size Limit Exceeded"
        });
        if (oUploader && typeof oUploader.clear === "function") {
          oUploader.clear();
        }
        return;
      }

      var that = this;
      var oReader = new FileReader();
      oReader.onload = function (e) {
        var sDataUrl = e.target.result;
        var sFileName = oFile.name;
        var isPdf = sFileName.toLowerCase().endsWith(".pdf") || oFile.type === "application/pdf";
        var sSizeFormatted = oFile.size >= 1024 * 1024
          ? (oFile.size / (1024 * 1024)).toFixed(1) + " MB"
          : (oFile.size / 1024).toFixed(1) + " KB";

        var sBase64Data = "";
        if (typeof sDataUrl === "string" && sDataUrl.indexOf(",") !== -1) {
          sBase64Data = sDataUrl.split(",")[1];
        } else {
          sBase64Data = sDataUrl || "";
        }

        var sFileType = oFile.type || "";
        if (!sFileType && sFileName.indexOf(".") !== -1) {
          sFileType = sFileName.split(".").pop().toUpperCase();
        }
        if (sFileType.length > 20) {
          sFileType = sFileType.substring(0, 20);
        }

        var dNow = new Date();
        var sFormattedDate = (dNow.getMonth() + 1) + "/" + dNow.getDate() + "/" + dNow.getFullYear();

        var oNewAttachment = {
          AttaId: sFileName,
          Descr: sFileName,
          FileData: sBase64Data,
          id: sFileName,
          fileName: sFileName,
          name: sFileName,
          fileSize: sSizeFormatted,
          size: sSizeFormatted,
          fileType: sFileType,
          uploadDate: sFormattedDate,
          isPdf: isPdf,
          url: sDataUrl
        };

        that._addAttachmentLocally(oNewAttachment);
        MessageToast.show("Attachment added: " + sFileName);

        if (oUploader && typeof oUploader.clear === "function") {
          oUploader.clear();
        }
      };

      oReader.readAsDataURL(oFile);
    },

    _addAttachmentLocally: function (oNewAttachment) {
      var oAppState = this.getModel("appState");
      if (oAppState) {
        var aAttachments = oAppState.getProperty("/delivery/attachments") || [];
        var bExists = aAttachments.some(function (att) {
          return (att.fileName === oNewAttachment.fileName) || (att.AttaId === oNewAttachment.AttaId) || (att.name === oNewAttachment.name);
        });
        if (!bExists) {
          aAttachments.push(oNewAttachment);
          oAppState.setProperty("/delivery/attachments", aAttachments);
          oAppState.setProperty("/attachments", aAttachments);
          oAppState.refresh(true);
        } else {
          MessageToast.show("File with same name already attached.");
        }
      }
    },

    onAttachmentPress: function (oEvent) {
      var oSource = oEvent.getSource();
      var oContext = oSource.getBindingContext("appState") || oSource.getBindingContext("soc_cart") || oSource.getBindingContext();
      var oAttachment = oContext ? oContext.getObject() : null;
      if (!oAttachment) {
        return;
      }

      var sFileName = oAttachment.Descr || oAttachment.fileName || oAttachment.name || oAttachment.AttaId || "attachment";
      var isPdf = oAttachment.isPdf || sFileName.toLowerCase().endsWith(".pdf") || oAttachment.fileType === "application/pdf";

      var sUrl = oAttachment.url;
      if (!sUrl && oAttachment.FileData) {
        if (oAttachment.FileData.startsWith("data:")) {
          sUrl = oAttachment.FileData;
        } else {
          var mime = isPdf ? "application/pdf" : "application/octet-stream";
          sUrl = "data:" + mime + ";base64," + oAttachment.FileData;
        }
      }

      if (isPdf) {
        if (sUrl) {
          if (sUrl.startsWith("data:")) {
            try {
              var parts = sUrl.split(',');
              var mimeMatch = parts[0].match(/:(.*?);/);
              var mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
              var byteCharacters = atob(parts[1]);
              var byteNumbers = new Array(byteCharacters.length);
              for (var i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              var byteArray = new Uint8Array(byteNumbers);
              var blob = new Blob([byteArray], { type: mimeType });
              var blobUrl = URL.createObjectURL(blob);
              var win = window.open(blobUrl, "_blank");
              if (!win) {
                var a = document.createElement("a");
                a.href = blobUrl;
                a.target = "_blank";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }
            } catch (err) {
              window.open(sUrl, "_blank");
            }
          } else {
            window.open(sUrl, "_blank");
          }
        } else {
          MessageToast.show("Attachment content is not available.");
        }
      } else {
        if (sUrl) {
          var downloadLink = document.createElement("a");
          downloadLink.href = sUrl;
          downloadLink.download = sFileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          MessageToast.show("Downloading " + sFileName);
        } else {
          MessageToast.show("Attachment content is not available.");
        }
      }
    },

    onDeleteAttachment: function (oEvent) {
      var oSource = oEvent.getSource();
      var oContext = oSource.getBindingContext("appState") || oSource.getBindingContext("soc_cart") || oSource.getBindingContext();
      if (!oContext) {
        var oListItem = oEvent.getParameter && oEvent.getParameter("listItem");
        if (oListItem) {
          oContext = oListItem.getBindingContext("appState") || oListItem.getBindingContext("soc_cart") || oListItem.getBindingContext();
        }
      }
      if (!oContext) {
        return;
      }
      var sPath = oContext.getPath();
      var iIndex = parseInt(sPath.split("/").pop(), 10);
      var oAppState = this.getModel("appState");
      var oAttachment = oContext.getObject();
      var sName = oAttachment ? (oAttachment.fileName || oAttachment.name || oAttachment.Descr || "attachment") : "attachment";

      MessageBox.confirm("Are you sure you want to remove '" + sName + "'?", {
        title: "Remove Attachment",
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.DELETE,
        onClose: function (sAction) {
          if (sAction === MessageBox.Action.DELETE) {
            var aAttachments = oAppState.getProperty("/delivery/attachments") || [];
            aAttachments.splice(iIndex, 1);
            oAppState.setProperty("/delivery/attachments", aAttachments);
            oAppState.setProperty("/attachments", aAttachments);
            oAppState.refresh(true);
            MessageToast.show("Attachment removed");
          }
        }
      });
    },

    onAttachmentFileChange: function (oEvent) {
      this.onFileSelected(oEvent);
    },

    onTriggerAddAttachment: function () {
      MessageToast.show("Choose a file using Browse to attach.");
    },

    onToggleSameAsBilling: function (oEvent) {
      var bState = oEvent.getParameter("state");
      var oAppState = this.getModel("appState");
      oAppState.setProperty("/delivery/sameAsBilling", bState);

      if (!bState) {
        this.onChangeDifferentAddress();
      } else {
        MessageToast.show("Reusing validated billing address (no second plug-in call)");
      }
      this._updatePendingActionText();
    },

    onChangeDifferentAddress: function () {
      var that = this;
      var oAppState = this.getModel("appState");

      this.openAddressValidationDialog("Ship-To", function (oSelectedAddress) {
        if (oSelectedAddress) {
          var oDiff = {
            street: oSelectedAddress.street,
            city: oSelectedAddress.city,
            postalCode: oSelectedAddress.postalCode,
            region: oSelectedAddress.region,
            formatted: oSelectedAddress.formatted,
            status: oSelectedAddress.status || "MODIFIED",
            statusState: that.formatter.addressStatusState(oSelectedAddress.status),
            note: oSelectedAddress.note || "Selected for ship-to delivery"
          };
          oAppState.setProperty("/delivery/differentAddress", oDiff);
          that._updatePendingActionText();
          MessageToast.show("Ship-to address updated (" + oDiff.status + ")");
        }
      });
    },

    _updatePendingActionText: function () {
      var oAppState = this.getModel("appState");
      var bSame = oAppState.getProperty("/delivery/sameAsBilling");
      var sStatus = bSame
        ? oAppState.getProperty("/customer/address/status")
        : oAppState.getProperty("/delivery/differentAddress/status");

      var sPendingAction = "";
      if (sStatus === "NEW") {
        sPendingAction = "On Create: Create SD Customer and Address (OData) → Create Sales Order";
      } else if (sStatus === "MODIFIED") {
        sPendingAction = "On Create: Update SD Customer Address (OData) → Create Sales Order";
      } else {
        sPendingAction = "On Create: None – Create Sales Order directly";
      }
      oAppState.setProperty("/pendingActionText", sPendingAction);
    },

    // ========================================================
    // STEP 7: REVIEW & ORDER CREATION (Screen 15 & 16)
    // ========================================================
    onWizardComplete: function () {
      this.onCreateSalesOrder();
    },

    onCreateSalesOrder: function () {
      var oAppState = this.getModel("appState");
      var sSalesOrderNo = "5000012345";
      var sShipToBp = "1000234588";

      oAppState.setProperty("/orderFinal/salesOrderNo", sSalesOrderNo);
      oAppState.setProperty("/orderFinal/shipToBp", sShipToBp);
      oAppState.setProperty("/orderFinal/shipmentPriority", "02");
      oAppState.setProperty("/orderFinal/shipmentPriorityText", "02 – High");
      oAppState.setProperty("/orderFinal/remarks", "Customer collecting item 20 on Friday");

      this.getView().getModel("wizardModel").setProperty("/orderCreated", true);
      MessageToast.show("Sales Order " + sSalesOrderNo + " created successfully!");
    },

    onSaveShipmentPriority: function () {
      var oAppState = this.getModel("appState");
      var sOrderNo = oAppState.getProperty("/orderFinal/salesOrderNo");
      var sPriority = oAppState.getProperty("/orderFinal/shipmentPriority");
      var sPriorityText = sPriority === "01" ? "01 – Immediate" : (sPriority === "02" ? "02 – High" : (sPriority === "03" ? "03 – Standard" : "04 – Low"));
      oAppState.setProperty("/orderFinal/shipmentPriorityText", sPriorityText);

      MessageToast.show(this.getText("prioritySavedMsg", [sPriorityText, sOrderNo]));
    },

    onCreateNewOrderReset: function () {
      var oOwnerComponent = this.getOwnerComponent();
      oOwnerComponent.setModel(models.createAppStateModel(), "appState");
      var oWizardModel = this.getView().getModel("wizardModel");
      oWizardModel.setProperty("/orderCreated", false);
      oWizardModel.setProperty("/showNewCustomerCapture", false);
      oWizardModel.setProperty("/isCreatingNewCustomer", false);

      var oWizard = this.byId("salesOrderWizard");
      if (oWizard) {
        var oStep1 = this.byId("stepCustomer");
        if (oStep1) oWizard.goToStep(oStep1);
      }
      MessageToast.show("Ready for new sales order flow");
    }
  });
});
