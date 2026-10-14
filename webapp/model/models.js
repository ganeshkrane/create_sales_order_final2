sap.ui.define([
  "sap/ui/model/json/JSONModel",
  "sap/ui/Device"
], function (JSONModel, Device) {
  "use strict";

  return {
    createDeviceModel: function () {
      var oModel = new JSONModel(Device);
      oModel.setDefaultBindingMode("OneWay");
      return oModel;
    },

    createAppStateModel: function () {
      var oInitialState = {
        currentStep: 1,
        // Customer session data
        customer: {
          bpNumber: "1000234571",
          name: "Thabo Mokoena",
          firstName: "Thabo",
          lastName: "Mokoena",
          title: "Mr.",
          telephone: "082 555 0142",
          email: "thabo.m@example.co.za",
          type: "Individual",
          dateOfBirth: "1980-01-15",
          gender: "Male",
          idType: "SA ID Number",
          idPassport: "8001015009087",
          companyName: "Mokoena Logistics (Pty) Ltd",
          regNo: "2018/049182/07",
          vatNo: "4820192837",
          authRepTitle: "Mr.",
          authRepFirstName: "Thabo",
          authRepSurname: "Mokoena",
          contactPerson: "Thabo Mokoena",
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
            status: "EXISTING",
            statusState: "Success"
          }
        },
        // Marketing information (Step 3)
        marketing: {
          marketToYou: "",
          marketingLanguage: "English",
          marketingCorrespondenceMethod: "",
          statementCorrespondenceMethod: "",
          creditBureauCheck: ""
        },
        // Consent preferences
        consent: {
          email: true,
          sms: true,
          phone: false,
          partners: false,
          capturedBy: "GR · 12 Oct 2026 · Store 1042"
        },
        // Order Header
        orderHeader: {
          orderType: "ZOR",
          orderTypeName: "Standard Store Order",
          orderTypeDesc: "ZOR · Take-away / collect today",
          soldToParty: "1000234571 - Thabo Mokoena",
          shipToParty: "1000234571 - Thabo Mokoena",
          customerReference: "REF-STORE-2026-001",
          requestedDeliveryDate: "12 Oct 2026",
          salesOrg: "1000",
          paymentTerms: "Immediate"
        },
        // Cart and items
        cartTab: "sales",
        deliverySchedules: {
          requestedDate: "Sep 28, 2026",
          customerName: "BM1 TEST1"
        },
        conditions: [
          {
            id: "cond-1",
            conditionType: "PR00 - Price",
            amount: "7,499.00",
            per: "1 EA",
            value: "7,499.00 ZAR"
          },
          {
            id: "cond-2",
            conditionType: "K004 - Material Discount",
            amount: "150.00-",
            per: "1 EA",
            value: "150.00- ZAR"
          }
        ],
        cart: [
          {
            item: "10",
            articleId: "ZCH-1001",
            targetQty: 4,
            qty: 4,
            um: "EA",
            description: "Oslo Dining Chair - Oak",
            name: "Oslo Dining Chair - Oak",
            productNo: "PRD-1001",
            valueAdds: "-",
            pricePerUnit: 1299.00,
            netPrice: 1299.00,
            itemPrice: 5196.00,
            netValue: 5196.00,
            salesPersonId: "SP-1042",
            site: "S101",
            itemCat: "TAN",
            extendedGuarantee: "ZEGP-24",
            rejReason: "-",
            discountPct: 0,
            hasCondition: false,
            conditionText: "",
            isSubItem: false
          },
          {
            item: "20",
            articleId: "ZTB-2040",
            targetQty: 1,
            qty: 1,
            um: "EA",
            description: "Nordic Dining Table 6-Seater",
            name: "Nordic Dining Table 6-Seater",
            productNo: "PRD-2040",
            valueAdds: "Cover",
            pricePerUnit: 6999.00,
            netPrice: 6999.00,
            itemPrice: 6299.10,
            netValue: 6299.10,
            salesPersonId: "SP-1042",
            site: "S101",
            itemCat: "TAN",
            extendedGuarantee: "-",
            rejReason: "-",
            discountPct: 10,
            hasCondition: true,
            conditionText: "Discount -10%",
            isSubItem: false
          },
          {
            item: "10.1",
            articleId: "ZEGP-24",
            targetQty: 4,
            qty: 4,
            um: "EA",
            description: "Extended Guarantee Plan (EGP)",
            name: "Extended Guarantee Plan (EGP)",
            subText: "value-added to item 10",
            productNo: "SRV-0024",
            valueAdds: "Warranty",
            pricePerUnit: 149.00,
            netPrice: 149.00,
            itemPrice: 596.00,
            netValue: 596.00,
            salesPersonId: "SP-1042",
            site: "S101",
            itemCat: "ZSRV",
            extendedGuarantee: "Yes",
            rejReason: "-",
            discountPct: 0,
            hasCondition: false,
            conditionText: "",
            isSubItem: true,
            parentItem: "10"
          },
          {
            item: "20.1",
            articleId: "ZCVR-77",
            targetQty: 1,
            qty: 1,
            um: "EA",
            description: "Table Protective Cover",
            name: "Table Protective Cover",
            subText: "cover article",
            productNo: "ACC-0077",
            valueAdds: "Accessory",
            pricePerUnit: 349.00,
            netPrice: 349.00,
            itemPrice: 349.00,
            netValue: 349.00,
            salesPersonId: "SP-1042",
            site: "S101",
            itemCat: "TAN",
            extendedGuarantee: "-",
            rejReason: "-",
            discountPct: 0,
            hasCondition: false,
            conditionText: "",
            isSubItem: true,
            parentItem: "20"
          }
        ],
        // Pricing summary breakdown
        pricing: {
          netValue: 12440.10,
          discounts: -699.90,
          vat: 1761.03,
          total: 14201.13
        },
        // Delivery choices and address (Review Shipping 23 fields)
        delivery: {
          methodKey: "DELIVERY",
          methodTitle: "Delivery to Customer",
          payee: "1000234571",
          payeeText: "1000234571 - Thabo Mokoena",
          poNumber: "PO-2026-99482",
          deliveryType: "Pick",
          requestedDeliveryDate: "Sep 28, 2026",
          singleShipment: true,
          carrier: "DHL Express",
          shipping: "Standard Delivery",
          incoterms: "FOB - Free on Board",
          sameAsBilling: true,
          shipTo: "1000234571",
          shipToName: "1000234571 - Thabo Mokoena (Primary Store)",
          shipToAddress: {
            street: "12 Rivonia Road",
            city: "Sandton",
            state: "Gauteng",
            postalCode: "2196",
            country: "South Africa",
            phone: "+27 82 555 0192"
          },
          billTo: "1000234571",
          billToName: "1000234571 - Thabo Mokoena",
          billToAddress: {
            street: "12 Rivonia Road",
            city: "Sandton",
            state: "Gauteng",
            postalCode: "2196",
            country: "South Africa",
            phone: "+27 82 555 0192"
          },
          shippingInstructions: "Deliver to front reception between 09:00 - 16:00",
          notesToReceiver: "Call customer upon arrival",
          attachments: [
            {
              AttaId: "test.pdf",
              Descr: "test.pdf",
              id: "test.pdf",
              fileName: "test.pdf",
              name: "test.pdf",
              fileSize: "168.2 KB",
              size: "168.2 KB",
              fileType: "application/pdf",
              uploadDate: "10/14/2026",
              isPdf: true,
              url: "data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNSAwIFIKPj4KPj4KPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA3Mwo+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGROCihTYWxlcyBPcmRlciBQRC1Db25maXJtYXRpb24gQXR0YWNobWVudCkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE5IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMjQ5IDAwMDAwIG4gCjAwMDAwMDAzNzIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxNDU2CiUlRU9G"
            }
          ],
          address: {
            formatted: "12 Rivonia Road, Sandton, 2196, Gauteng",
            status: "EXISTING",
            statusState: "Success"
          },
          differentAddress: {
            formatted: "45 Jan Smuts Avenue, Rosebank, 2196, Gauteng",
            status: "MODIFIED",
            statusState: "Warning",
            note: "Last delivered 02 Aug 2026 · Unit number added"
          },
          oaa: [
            {
              article: "Oslo Dining Chair - Oak",
              requested: 4,
              confirmed: 4,
              earliestDate: "14 Oct 2026",
              statusText: "In store",
              statusState: "Success"
            },
            {
              article: "Nordic Dining Table",
              requested: 1,
              confirmed: 1,
              earliestDate: "16 Oct 2026",
              statusText: "Warehouse - 3 days",
              statusState: "Information"
            }
          ]
        },
        // Final review and created order
        orderFinal: {
          salesOrderNo: "5000012345",
          shipToBp: "1000234588",
          shipmentPriority: "02",
          shipmentPriorityText: "02 – High",
          remarks: "Customer collecting item 20 on Friday",
          isSaved: true
        },
        // Review and Place Order fields matching specification
        review: {
          shippingDetails: {
            shipTo: "1000234571 - Thabo Mokoena",
            payee: "1000234571 - Thabo Mokoena",
            phoneNumber: "+27 82 555 0192",
            requestedDeliveryDate: "Sep 28, 2026",
            singleShipment: "Yes",
            carrier: "DHL Express",
            shipping: "Standard Delivery",
            incoterms: "FOB - Free on Board",
            shippingInstructions: "Deliver to front reception between 09:00 - 16:00",
            notesToReceiver: "Call customer upon arrival"
          },
          billingDetails: {
            billTo: "1000234571 - Thabo Mokoena",
            address: "12 Rivonia Road",
            city: "Sandton",
            state: "Gauteng",
            postalCode: "2196",
            country: "South Africa",
            phoneNumber: "+27 82 555 0192"
          },
          orderDetails: {
            soldTo: "1000234571 - Thabo Mokoena",
            applicationId: "PO-2026-99482",
            salesOrderType: "ZOR - Standard Store Order"
          }
        }
      };

      return new JSONModel(oInitialState);
    }
  };
});
