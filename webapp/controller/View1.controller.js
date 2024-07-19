sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("project7.controller.View1", {
            onInit: function () {
                this.bsyDialog = new sap.m.BusyDialog();
                this.bsyDialog.open();
                var me = this;
                me._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                me._oRouter.attachRouteMatched(me.handleRouteMatched, me);
                var LimitsTemplateModel = new sap.ui.model.json.JSONModel({
                    FirstEncounter: true,
                    DiagtypeData: [],
                    DiagnosisCatalogValueHelp: {},
                    DiagnosisCodeValueHelp: {},
                    DiagnosisLevelValueHelp: {}
                });
                var oPanel = this.byId("_IDGenPanel1");
                oPanel.setExpanded(!oPanel.getExpanded());
                var sPath = jQuery.sap.getModulePath("project7", "/model/Code.json");
                var oModel = new sap.ui.model.json.JSONModel(sPath);
                //  var sPathHeaderItem =new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath());
                this.getView().setModel(oModel, "sPathHeaderItemModel");
                var sPath1 = jQuery.sap.getModulePath("project7", "/model/PlanHeader.json");
                var oModel1 = new sap.ui.model.json.JSONModel(sPath1);
                //  var sPathHeaderItem =new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath());
                this.getView().setModel(oModel1, "LimitsTabableModel");

                var oModel_Data = this.getOwnerComponent().getModel();
                oModel_Data.read("/DiagnosisTypeConfig", {
                    success: function (oData) {
                        LimitsTemplateModel.setProperty("/DiagtypeData", oData.results);
                        this.getView().setModel(new sap.ui.model.json.JSONModel(oData.results), "DiagTypeConfigModel")
                    }.bind(this),
                    error: function (oError) {
                        that.bsyDialog.close();
                        var msg = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageToast.show(msg);
                    }
                });
                var aFilter = [];
                var caseGUID = new sap.ui.model.Filter('CaseID', 'EQ', "000000000114");
                aFilter.push(caseGUID)
                oModel_Data.read("/Patients('0000000151')/to_Case", {
                    filters: aFilter,
                    success: function (oData) {
                        var sPathGUID = "/EpisodeOfCareSet" + "(" + "guid'" + oData.results[0].CaseUUID + "')";
                        oModel_Data.read(sPathGUID, {
                            urlParameters: {
                                $expand: "to_Encounter,to_Encounter/to_Diagnosis,to_Encounter/to_Diagnosis/to_DiagType"
                            },
                            success: function (oData1) {
                                var LimitsTemplateModel1 = new sap.ui.model.json.JSONModel();
                                LimitsTemplateModel1.setProperty("/DiagtypeData", LimitsTemplateModel.getData().DiagtypeData);
                                var oTable = this.getView().byId("_IDGenTable1");
                                var oDiadata = LimitsTemplateModel1.getData().DiagtypeData
                                oDiadata.forEach(function (aDiatype) {
                                    var oColumn = new sap.m.Column("col" + aDiatype.DiagType, {
                                        header: new sap.m.Label({
                                            text: aDiatype.DiagType,
                                            tooltip: aDiatype.DiagType_Text
                                            // template: oTemplate
                                        }),
                                    });
                                    oTable.addColumn(oColumn);
                                    var oTemplate = oTable.getBindingInfo("items").template;
                                    oTemplate.addCell(new sap.m.CheckBox({
                                        id: "id_" + aDiatype.DiagType,
                                        selected: "{LimitsTemplateModel1>" + aDiatype.DiagType + "}"
                                    }));
                                    oData1.to_Encounter.results.forEach(function (encounter) {
                                        var to_diag = encounter.to_Diagnosis.results; //table Data
                                        if (to_diag.length > 0) {
                                            to_diag.forEach(function (diagnosis) {
                                                diagnosis[aDiatype.DiagType] = false;
                                            });

                                        } else {
                                            to_diag.push({});
                                        }
                                    });
                                });
                                oTable.addColumn(
                                    new sap.m.Column({
                                        header: new sap.m.Label({
                                            text: ""
                                        })
                                    })
                                );
                                var oTemplate = oTable.getBindingInfo("items").template;
                                oTemplate.addCell(new sap.m.Button({
                                    press: this.onDiagDeletePress.bind(this),
                                    icon: "sap-icon://delete",
                                    type: "Reject"
                                }));
                                this.getView().setModel(LimitsTemplateModel1, "LimitsTemplateModel1");
                                var aEnc = oData1.to_Encounter.results;
                                aEnc.forEach(function (encounter) {
                                    var to_diag = encounter.to_Diagnosis.results; //table Data
                                    to_diag.forEach(function (diagnosis) {
                                        if (diagnosis.to_DiagType && diagnosis.to_DiagType.results > 0) {
                                            diagnosis.to_DiagType.results.forEach(function (diagType) {
                                                var type = diagType.DiagType;
                                                diagnosis[type] = diagType.DiagFlag
                                            });
                                        }
                                    });
                                    if (to_diag.length !== 1) {
                                        to_diag.push({});
                                    }
                                });

                                this.getView().getModel("LimitsTemplateModel1").setData(oData1);

                                oModel_Data.read("/Patients('0000000151')/to_Diagnosis", {
                                    urlParameters: {
                                        $expand: "to_DiagType"
                                    },
                                    success: function (oData) {
                                        me.bsyDialog.close();
                                        var oTable = this.getView().byId("_IDGenTable2");
                                        var oDiadata = LimitsTemplateModel.getData().DiagtypeData
                                        oDiadata.forEach(function (aDiatype) {
                                            var oColumn = new sap.m.Column("colChrnic" + aDiatype.DiagType, {
                                                header: new sap.m.Label({
                                                    text: aDiatype.DiagType,
                                                    tooltip: aDiatype.DiagType_Text
                                                    // template: oTemplate
                                                }),
                                            });
                                            oTable.addColumn(oColumn);
                                            var oTemplate = oTable.getBindingInfo("items").template;
                                            oTemplate.addCell(new sap.m.CheckBox({
                                                id: "Chroniid_" + aDiatype.DiagType,
                                                selected: "{LimitsTabableModel>" + aDiatype.DiagType + "}"
                                            }));
                                        });
                                        var oModel1 = new sap.ui.model.json.JSONModel();
                                        this.getView().setModel(oModel1, "LimitsTabableModel");

                                        var aChroninDiag = oData.results;
                                        //if (aChroninDiag.length == 0) {
                                            aChroninDiag.push({});
                                       // }
                                        aChroninDiag.forEach(function (ChroninDiag) {
                                            if (ChroninDiag && ChroninDiag.to_DiagType && ChroninDiag.to_DiagType.results.length > 0) {
                                                var to_diagtype = ChroninDiag.to_DiagType.results; //table Data
                                                to_diagtype.forEach(function (diagtype) {
                                                    ChroninDiag[diagtype.DiagType] = diagtype.DiagFlag
                                                })
                                            }
                                        });
                                        this.getView().getModel("LimitsTabableModel").setData(oData.results);
                                    }.bind(this),
                                    error: function (oError) {
                                        me.bsyDialog.close();
                                        var msg = JSON.parse(oError.responseText).error.message.value;
                                        sap.m.MessageToast.show(msg);
                                    }
                                });
                            }.bind(this),
                            error: function (oError) {
                                me.bsyDialog.close();
                                var msg = JSON.parse(oError.responseText).error.message.value;
                                sap.m.MessageToast.show(msg);
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        me.bsyDialog.close();
                        var msg = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageToast.show(msg);
                    }
                });

            },
            onDiagDeletePress: function (oEvent) {
                var aDeletedDiagnosisEntry = []
                var object = oEvent.getSource().getParent().getBindingContext("LimitsTemplateModel1").getObject();
                object.Canceled = true; 
                aDeletedDiagnosisEntry.push(object);
                sap.m.MessageToast.show(object.DiagCode + " " + "will be deleted");
            },
            _handleValueHelpCloseNew: function (evt) {
                var that = this;
                var aSelectedItems = evt.getParameter("selectedItems");
                // oMultiInput = this.byId("multiInput");
                var index = that.getView().getModel("LimitsTabableModel").getData().header.length;
                var finalIndx = index - 1;

                if (aSelectedItems && aSelectedItems.length > 0) {
                    aSelectedItems.forEach(function (oItem) {
                        var newItem = {
                            Catalog: "ICD-10",
                            Code: oItem.getTitle(),
                            enabledcode: true,
                            Description: oItem.getDescription(),
                            Level: "",
                            Laternity: "",
                            Certainity: "",
                            C1: false,
                            C2: false
                        };
                        that.getView().getModel("LimitsTabableModel").getData().header.splice(finalIndx, 0, newItem);
                        that.getView().getModel("LimitsTabableModel").refresh();
                        //  var oModel = this.getOwnerComponent().getModel("invoice");
                        //  oModel.setProperty("/Invoices", oModel.getProperty("/Invoices").concat(newItem));
                        // oMultiInput.addToken(new Token({
                        //     text: oItem.getTitle()
                        // }));
                    });
                }
            },
            _handleDiagCodeVHClose: function (evt) {
            },
            handleValueHelpNew: function () {
                var that = this;
                if (!this.HeaderFrgmentNew) {
                    this.HeaderFrgmentNew = sap.ui.xmlfragment("project7.view.fragments.DValuehelp", this);
                    this.getView().addDependent(this.HeaderFrgmentNew);
                    // this.HeaderFrgment.setModel(this.getView().getModel("plantModel"));
                }
                that.HeaderFrgmentNew.open();
                var sPath = jQuery.sap.getModulePath("project7", "/model/Code.json");
                var oModel = new sap.ui.model.json.JSONModel(sPath);
                //  var sPathHeaderItem =new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath());
                this.getView().setModel(oModel, "sPathHeaderItemModel");
            },
            onDiagCodeVHPress: function () {
                var that = this;
                if (!this.HeaderFrgment) {
                    this.HeaderFrgment = sap.ui.xmlfragment("project7.view.fragments.DiagCodeVH", this);
                    this.getView().addDependent(this.HeaderFrgment);
                    // this.HeaderFrgment.setModel(this.getView().getModel("plantModel"));
                }
                that.HeaderFrgment.open();
                var sPath = jQuery.sap.getModulePath("project7", "/model/Code.json");
                var oModel = new sap.ui.model.json.JSONModel(sPath);
                //  var sPathHeaderItem =new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath());
                this.getView().setModel(oModel, "sPathHeaderItemModel");
            },

            /**Save Button Press handler
             * 
             */
            onPress: function () {

            },

            /**
             * 
             */
            onChangeLevel: function (oEvent) {


            },

            DiagnosisData: function () {
                var that = this;
                var oModel = this.getOwnerComponent().getModel();
                var DiagnosisModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(DiagnosisModel, "DiagnosisModel");
                this.bsyDialog = new sap.m.BusyDialog();
                this.bsyDialog.open();
                oModel.read("/DiagnosisSet", {
                    async: false,
                    // urlParameters:{
                    //     $expand:"to_DiagType"

                    // },

                    success: function (oData) {
                        that.bsyDialog.close();
                        that.getView().getModel("DiagnosisModel").setSizeLimit(oData.results.length);
                        that.getView().getModel("DiagnosisModel").setData(oData);

                    }.bind(this),
                    error: function (oError) {
                        that.bsyDialog.close();
                        var msg = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageToast.show(msg);
                    }.bind(this)
                });
            },

            PatientsData: function () {
                var that = this;
                var oModel = this.getOwnerComponent().getModel();
                var PatientsModel = new sap.ui.model.json.JSONModel();
                // this.getView().setModel(PatientsModel, "PatientsModel");
                this.bsyDialog = new sap.m.BusyDialog();
                this.bsyDialog.open();
                oModel.read("/PatientNames", {
                    async: false,
                    // urlParameters:{
                    //     $expand:"to_Diagnosis"

                    // },

                    success: function (oData) {
                        that.bsyDialog.close();
                        // that.getView().getModel("PatientsModel").setSizeLimit(oData.results.length);
                        // that.getView().getModel("PatientsModel").setData(oData);

                    }.bind(this),
                    error: function (oError) {
                        that.bsyDialog.close();
                        var msg = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageToast.show(msg);
                    }
                });

            },

            handleRouteMatched: function () {
                var sPath = jQuery.sap.getModulePath("project7", "/model/Code.json");
                var oModel = new sap.ui.model.json.JSONModel(sPath);
                //  var sPathHeaderItem =new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath());
                this.getView().setModel(oModel, "sPathHeaderItemModel");
                // this.EncounterData();
                // this.PatientsData();
                // this.DiagnosisData();
            },

            onPressSaveConfirmation: function(){
                if (!this.oApproveDialog) {
                    var sDiagCode;
                    aDeletedDiagnosisEntry.forEach(function(DeletedCode){
                        sDiagCode = sDiagCode + "," + DeletedCode.DiagCode
                    });
                    this.oApproveDialog = new Dialog({
                        type: DialogType.Message,
                        title: "Confirm",
                        content: new Text({ text: "Diagnosis Entries with these code" + sDiagCode + "would be deleted, Confirm?"  }),
                        beginButton: new Button({
                            type: ButtonType.Emphasized,
                            text: "Submit",
                            press: this.onPressSave()
                        }.bind(this)),
                        endButton: new Button({
                            text: "Cancel",
                            press: function () {
                                this.oApproveDialog.close();
                            }.bind(this)
                        })
                    });
                }
    
                this.oApproveDialog.open();


            },

            onPressSave: function (oevt) {
                var oModel = this.getOwnerComponent().getModel();
                var oModel2 = new sap.ui.model.odata.ODataModel(oModel.sServiceUrl, true);
                var oLimitsData = this.getView().getModel("LimitsTemplateModel1").getData();
                var oEncounters = this.getView().getModel("LimitsTemplateModel1").getData().to_Encounter.results;
                var oPayload = [];
                var that = this;
                oEncounters.forEach(function (encounter) {
                    var aDiagnosis = encounter.to_Diagnosis.results;
                    var sEncounterUUID = encounter.EncounterUUID
                    aDiagnosis.forEach(function (oDiagnosis) {
                        var aDiagType = [];
                        if (oDiagnosis && oDiagnosis.to_DiagType && oDiagnosis.to_DiagType.results){
                            oDiagnosis.to_DiagType.results.forEach(function (diagType) {
                                aDiagType.push({
                                    "DiagType": diagType.DiagType,
                                    "DiagFlag": oDiagnosis[diagType.DiagType],
                                    "CreatedBy": "",
                                    "CreatedAt": null,
                                    "LocalLastChangedUser": "",
                                    "LocalLastChangedAt": null,
                                    "Canceled": false
                                });
                            });
                        } else {
                            var aDiagosisType = that.getView().getModel("DiagTypeConfigModel").getData();
                            aDiagosisType.forEach(function (diagType) {
                                aDiagType.push({
                                    "DiagType": diagType.DiagType,
                                    "DiagFlag": oDiagnosis[diagType.DiagType],
                                    "CreatedBy": "",
                                    "CreatedAt": null,
                                    "LocalLastChangedUser": "",
                                    "LocalLastChangedAt": null,
                                    "Canceled": false
                                });
                        });
                        }
                        if (oDiagnosis.DiagCatalog && oDiagnosis.DiagCode) { 

                            var sEncUUID = oDiagnosis.DiagUUID ? oDiagnosis.EncounterUUID : sEncounterUUID 
                            oPayload.push({
                                "DiagCatalog": oDiagnosis.DiagCatalog,
                                "DiagCode": oDiagnosis.DiagCode,
                                "DiagLevel": oDiagnosis.DiagLevel,
                                "EncounterUUID": sEncUUID,
                                "PatientId": oDiagnosis.PatientId,
                                "DiagSecondary": oDiagnosis.DiagSecondary,
                                "DiagLat": oDiagnosis.DiagLat,
                                "DiagCert": oDiagnosis.DiagCert,
                                "DiagStart": oDiagnosis.DiagStart,
                                "DiagEnd": oDiagnosis.DiagEnd,
                                "Canceled": oDiagnosis.Canceled,
                                "to_DiagType": aDiagType
                            });
                        }
                    });
                });
                var aBatch = [];
                oModel2.setUseBatch(true);
                oPayload.forEach(function (payloadbatch) {
                    aBatch.push(oModel2.createBatchOperation("/DiagnosisSet", "POST", payloadbatch));
                });
                oModel2.addBatchChangeOperations(aBatch);    
                oModel2.submitBatch(function (oData, oResponse) {
                    sap.m.MessageToast("Data Saved")
                }, function (oError) { });
            }
        });
    });
