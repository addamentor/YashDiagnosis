sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Dialog",
    "sap/m/library",
    "sap/m/Button",
    "sap/m/MessageToast",
    "sap/m/Text",
    "sap/ui/model/json/JSONModel",
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Dialog, mobileLibrary, Button, MessageToast, Text, JSONModel, Filter, FilterOperator, MessageBox) {
        "use strict";
        var ButtonType = mobileLibrary.ButtonType;
        var DialogType = mobileLibrary.DialogType;
        return Controller.extend("project7.controller.View1", {

            onInit: function () {
                this.FirstTime = true;
                this.ChronicFlag = false;
                this.bsyDialog = new sap.m.BusyDialog();
                // var aUrlParams = window.location.href.split("?");
                // var sCaseUUID = aUrlParams[1].split('&')[1].split('=')[1]
                this.bsyDialog.open();
                var me = this;
                me._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                me._oRouter.attachRouteMatched(me.handleRouteMatched, me);
                this.sContextPath;
                // this._LoadData(sCaseUUID);
                // this._loadVHData();
            },

            /**
             * Method to load initial Data
             */

            _LoadData: function (CaseUUID) {
                var that = this;
                var LimitsTemplateModel = new sap.ui.model.json.JSONModel({
                    FirstEncounter: true,
                    DiagtypeData: [],
                    DiagtypeDataChr: [],
                    DeletedDiagnsis: [],
                    DiagnosisCodeValueHelp: {},
                    DiagnosisLevelValueHelp: {}
                });
                this.getView().setModel(new JSONModel([]), "DeletedDiagnosis");
                this.getView().setModel(new JSONModel([]), "ChronicDeletedDiagnosis");
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
                var Model_header = this.getOwnerComponent().getModel();
                var oModel_Data = this.getOwnerComponent().getModel("ReadModel");
                var oModel_Data1 = this.getOwnerComponent().getModel("DiagConfigModel");
                
                oModel_Data1.setHeaders({
                    "X-Requested-With":"XMLHttpRequest",
                    "Content-Type":"application/atom+xml",
                    "DataServiceVersion":"2.0",
                    "Accept": "application/atom+xml,application/atomsvc+xml,application/xml",
                    "X-CSRF-Token":"Fetch"
                });
                oModel_Data1.read("/DiagnosisTypeConfig", {
                    success: function (oData) {
                        var aTempDiag = oData.results;
                        var aTempDiagchr = [];
                        var aTempDiagOth = []
                        if (aTempDiag.length > 0) {
                            aTempDiag.forEach(function (type) {
                                if (type.DiagChr) {
                                    aTempDiagchr.push(type)
                                } else {
                                    aTempDiagOth.push(type)
                                }
                            })
                            LimitsTemplateModel.setProperty("/DiagtypeData", aTempDiagOth);
                            LimitsTemplateModel.setProperty("/DiagtypeDataChr", aTempDiagchr);
                            this.getView().setModel(new sap.ui.model.json.JSONModel(aTempDiagOth), "DiagTypeConfigModel")
                            this.getView().setModel(new sap.ui.model.json.JSONModel(aTempDiagchr), "DiagTypeConfigModelChr")
                        }
                    }.bind(this),
                    error: function (oError) {
                        that.bsyDialog.close();
                        var msg = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageToast.show(msg);
                    }
                });
                var aFilter = [];

                // var caseGUID = CaseUUID;
                var sPathGUID = "/EpisodeOfCareSet" + "(" + "guid'" + CaseUUID + "')";
                oModel_Data.read(sPathGUID, {
                    urlParameters: {
                        $expand: "to_Encounter,to_Encounter/to_Diagnosis,to_Encounter/to_Diagnosis/to_DiagType"
                    },
                    success: function (oData1, oResponse) {
                    var sPatientID = oData1.PatientID;
                    var filter1 = []
                    filter1.push(new Filter({
                        path: 'PatientId',
                        operator: FilterOperator.EQ,
                        value1: sPatientID
                    }))

                    Model_header.setHeaders({
                        "X-Requested-With":"XMLHttpRequest",
                        "Content-Type":"application/atom+xml",
                        "DataServiceVersion":"2.0",
                        "Accept": "application/atom+xml,application/atomsvc+xml,application/xml",
                        "X-CSRF-Token":"Fetch"
                 });

                    Model_header.read("/Patients('" + sPatientID + "')", {
                        urlParameters: {
                            $expand: "to_Case,to_Diagnosis,to_Name,to_BusinessPartner,to_BusinessPartner/to_Address," +
                                "to_BusinessPartner/to_Address/to_EmailAddress,to_BusinessPartner/to_Address/to_MobilePhoneNumber," +
                                "to_BusinessPartner/to_Address/to_PhoneNumber,to_BusinessPartner/to_Cases,to_PatCvrg"
                        },
                        success: function (oSuccess) {
                            var oPatientData = [];
                            oPatientData.patientIdDisplay = Number(oSuccess["PatientId"]).toString();
                            oPatientData.patientGender = oSuccess["to_BusinessPartner"]["IsMale"] ? "Male" : oSuccess["to_BusinessPartner"]["IsFemale"] ? "Female" : "";
                            oPatientData.patientBirthDate = oSuccess["to_BusinessPartner"]["BirthDate"];
                            oPatientData.patientAge = Math.floor((new Date() - oPatientData.patientBirthDate) / (365 * 24 * 60 * 60 * 1000));
                            oPatientData.BusinessPartnerFullName = oSuccess["to_BusinessPartner"]["BusinessPartnerFullName"]
                            var sFullName = oSuccess["to_BusinessPartner"]["BusinessPartnerFullName"]
                            var names = sFullName.split(/\s+/);
                            names[0] = names[0].substr(0, 1);
                            names[1] = names[1].substr(0, 1);
                            var name_abbr = names.join('');
                            oPatientData.patientInitials = name_abbr;
                            oPatientData.patientMobile = oSuccess["to_BusinessPartner"]["to_Address"].results.length > 0 ? oSuccess["to_BusinessPartner"]["to_Address"].results[0]["to_MobilePhoneNumber"]["results"][0]["InternationalPhoneNumber"] : "";
                            oPatientData.patientEmail = oSuccess["to_BusinessPartner"]["to_Address"].results.length > 0 ? oSuccess["to_BusinessPartner"]["to_Address"].results[0]["to_EmailAddress"]["results"][0]["EmailAddress"] : "";

                            // _.forEach(_.keys(oSuccess), function (_key) {
                            that.getView().setModel(new JSONModel(oPatientData), "patientDetailsModel")
                            // that.getView().getModel("patientDetailsModel").setData(oPatientData);
                            // }); 
                        },
                        error: function () {

                        }
                    });



                        this.sETag = oResponse.headers['etag'];
                        var LimitsTemplateModel1 = new sap.ui.model.json.JSONModel();
                        LimitsTemplateModel1.setProperty("/DiagtypeData", LimitsTemplateModel.getData().DiagtypeData);
                        var oTable = this.getView().byId("_IDGenTable1");
                        var oDiadata = LimitsTemplateModel1.getData().DiagtypeData
                        oDiadata.forEach(function (aDiatype) {
                            if (!oColumn) {
                                var oColumn = new sap.m.Column("col" + aDiatype.DiagType, {
                                    header: new sap.m.Label({
                                        text: aDiatype.DiagType,
                                        tooltip: aDiatype.DiagType_Text,

                                        // template: oTemplate
                                    }),
                                    hAlign: "Center",
                                    width: "4%"
                                },
                                );
                            }
                            oTable.addColumn(oColumn);
                            if (!oTemplate) {
                                var oTemplate = oTable.getBindingInfo("items").template;
                                oTemplate.addCell(new sap.m.CheckBox({
                                    id: "id_" + aDiatype.DiagType,
                                    selected: "{LimitsTemplateModel1>" + aDiatype.DiagType + "}",
                                    enabled: "{ConfigModel>/DiagEnab}"
                                }));
                            }
                            oData1.to_Encounter.results.forEach(function (encounter) {
                                var to_diag = encounter.to_Diagnosis.results; //table Data
                                if (to_diag.length > 0) {
                                    to_diag.forEach(function (diagnosis) {
                                        diagnosis[aDiatype.DiagType] = false;
                                    });

                                } else {
                                    //  to_diag.push({});
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
                            type: "Reject",
                            enabled: "{ConfigModel>/DiagEnab}"
                        }));
                        this.getView().setModel(LimitsTemplateModel1, "LimitsTemplateModel1");
                        var aEnc = oData1.to_Encounter.results;
                        aEnc.forEach(function (encounter) {
                            var to_diag = encounter.to_Diagnosis.results; //table Data
                            to_diag.forEach(function (diagnosis) {
                                if (diagnosis.to_DiagType && diagnosis.to_DiagType.results.length > 0) {
                                    diagnosis.eTag = diagnosis.__metadata.etag;
                                    diagnosis.DiagSecondary = diagnosis.DiagSecondary === true ? 'S' : 'P';
                                    diagnosis.to_DiagType.results.forEach(function (diagType) {
                                        var type = diagType.DiagType;
                                        diagnosis[type] = diagType.DiagFlag
                                    });
                                }
                            });
                            //if (to_diag === "X") {

                             to_diag.push({});
                            //  }
                        });

                        this.getView().getModel("LimitsTemplateModel1").setData(oData1);

                        oModel_Data.read("/Patients('" + sPatientID + "')/to_Diagnosis", {
                            urlParameters: {
                                $expand: "to_DiagType"
                            },
                            success: function (oData) {
                                that.bsyDialog.close();
                                var oTable = this.getView().byId("_IDGenTable2");
                                var oDiadata = LimitsTemplateModel.getData().DiagtypeDataChr
                                oDiadata.forEach(function (aDiatype) {
                                    if (!oColumn) {
                                        var oColumn = new sap.m.Column("colChrnic" + aDiatype.DiagType, {
                                            header: new sap.m.Label({
                                                text: aDiatype.DiagType,
                                                tooltip: aDiatype.DiagType_Text
                                                // template: oTemplate
                                            }),
                                            hAlign: "Center",
                                            width: "15%"
                                        });
                                    }
                                    oTable.addColumn(oColumn);
                                    if (!oTemplate) {
                                        var oTemplate = oTable.getBindingInfo("items").template;
                                        oTemplate.addCell(new sap.m.CheckBox({
                                            id: "Chroniid_" + aDiatype.DiagType,
                                            selected: "{LimitsTabableModel>" + aDiatype.DiagType + "}",
                                            enabled: "{ConfigModel>/DiagEnab}"
                                        }));
                                    }
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
                                    press: this.onChrDiagDeletePress.bind(this),
                                    icon: "sap-icon://delete",
                                    type: "Reject",
                                    enabled: "{ConfigModel>/DiagEnab}"
                                }));
                                var oModel1 = new sap.ui.model.json.JSONModel();
                                this.getView().setModel(oModel1, "LimitsTabableModel");

                                var aChroninDiag = oData.results;
                                // if (aChroninDiag === "X") {
                                aChroninDiag.push({});
                                //  }
                                aChroninDiag.forEach(function (ChroninDiag) {
                                    if (ChroninDiag && ChroninDiag.to_DiagType && ChroninDiag.to_DiagType.results.length > 0) {
                                        ChroninDiag.eTag = ChroninDiag.__metadata.etag;
                                        ChroninDiag.DiagSecondary = ChroninDiag.DiagSecondary === true ? 'S' : 'P';
                                        var to_diagtype = ChroninDiag.to_DiagType.results; //table Data
                                        to_diagtype.forEach(function (diagtype) {
                                            ChroninDiag[diagtype.DiagType] = diagtype.DiagFlag
                                        })
                                    }
                                });
                                this.getView().getModel("LimitsTabableModel").setData(oData.results);
                            }.bind(this),
                            error: function (oError) {
                                that.bsyDialog.close();
                                var msg = JSON.parse(oError.responseText).error.message.value;
                                sap.m.MessageToast.show(msg);
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        that.bsyDialog.close();
                        var msg = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageToast.show(msg);
                    }
                });
                //     }.bind(this),
                //     error: function (oError) {
                //         that.bsyDialog.close();
                //         var msg = JSON.parse(oError.responseText).error.message.value;
                //         sap.m.MessageToast.show(msg);
                //     }
                // });
            },
            onDiagEndDatePickerChange:function(evt){
                var path = evt.getSource().getId().split("_IDGenTable2-")[1];
                var Sdate = this.getView().getModel("LimitsTabableModel").getData()[path].DiagStart;
                var Edate = this.getView().getModel("LimitsTabableModel").getData()[path].DiagEnd;
                if(Edate < Sdate){
                    evt.getSource().setValueState(sap.ui.core.ValueState.Error);
                    evt.getSource().setValueStateText("End date should be a greater then start date");
                   
                }else{
                    evt.getSource().setValueState(sap.ui.core.ValueState.None);
                    evt.getSource().valueStateText("")
                }
            },

            _loadVHData:function(){
                var that = this;
                var oDiagCatModel = this.getOwnerComponent().getModel("DiagCatlogVH")
                oDiagCatModel.read("/DiagnosisCatalogValueHelp", {
                    success: function (oResponse) {
                        if (oResponse.results && oResponse.results.length > 0) {
                            that.getView().setModel(new JSONModel(oResponse.results), "DiagCatlogVHModel");
                        }
                    }
                });
                var oDiagLATModel = this.getOwnerComponent().getModel("DiagLatVH")
                oDiagLATModel.read("/DiagnosisLateralityValueHelp", {
                    success: function (oResponse) {
                        if (oResponse.results && oResponse.results.length > 0) {
                            that.getView().setModel(new JSONModel(oResponse.results), "DiagLatVHModel");
                        }
                    }
                });

                var oDiagCertModel = this.getOwnerComponent().getModel("DiagCertVH")
                oDiagCertModel.read("/DiagnosisCertaintyValueHelp", {
                    success: function (oResponse) {
                        if (oResponse.results && oResponse.results.length > 0) {
                            that.getView().setModel(new JSONModel(oResponse.results), "DiagCertVHVHModel");
                        }
                    }
                });
                
            },
            loadDataEdit: function(CaseUUID) {
                var that = this;
                var LimitsTemplateModel = new sap.ui.model.json.JSONModel({
                    FirstEncounter: true,
                    DiagtypeData: [],
                    DiagtypeDataChr: [],
                    DeletedDiagnsis: [],
                    DiagnosisCodeValueHelp: {},
                    DiagnosisLevelValueHelp: {}
                });
                sap.ui.core.BusyIndicator.show();
                var oModel_Data = this.getOwnerComponent().getModel("ReadModel");
                // var caseGUID = CaseUUID;
                var sPathGUID = "/EpisodeOfCareSet" + "(" + "guid'" + CaseUUID + "')";
                oModel_Data.read(sPathGUID, {
                    urlParameters: {
                        $expand: "to_Encounter,to_Encounter/to_Diagnosis,to_Encounter/to_Diagnosis/to_DiagType"
                    },
                    success: function (oData1, oResponse) {
                        var sPatientID = oData1.PatientID;
                        // sap.ui.core.BusyIndicator.hide();
                        this.sETag = oResponse.headers['etag'];
                        var LimitsTemplateModel1 = new sap.ui.model.json.JSONModel();
                        LimitsTemplateModel1.setProperty("/DiagtypeData", LimitsTemplateModel.getData().DiagtypeData);
                        var oTable = this.getView().byId("_IDGenTable1");
                        var oDiadata = LimitsTemplateModel1.getData().DiagtypeData
                        oDiadata.forEach(function (aDiatype) {
                            if (!oColumn) {
                                var oColumn = new sap.m.Column("col" + aDiatype.DiagType, {
                                    header: new sap.m.Label({
                                        text: aDiatype.DiagType,
                                        tooltip: aDiatype.DiagType_Text,
                                    }),
                                    hAlign: "Center",
                                    width: "4%"
                                },
                                );
                            }
                            oTable.addColumn(oColumn);
                            if (!oTemplate) {
                                var oTemplate = oTable.getBindingInfo("items").template;
                                oTemplate.addCell(new sap.m.CheckBox({
                                    id: "id_" + aDiatype.DiagType,
                                    selected: "{LimitsTemplateModel1>" + aDiatype.DiagType + "}"

                                }));
                            }
                            oData1.to_Encounter.results.forEach(function (encounter) {
                                var to_diag = encounter.to_Diagnosis.results; //table Data
                                if (to_diag.length > 0) {
                                    to_diag.forEach(function (diagnosis) {
                                        diagnosis[aDiatype.DiagType] = false;
                                    });

                                } else {
                                    //  to_diag.push({});
                                }
                            });
                        });
                        if (this.byId("btnEdit").getText() !== "edit header") {
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
                        }
                        this.getView().setModel(LimitsTemplateModel1, "LimitsTemplateModel1");
                        var aEnc = oData1.to_Encounter.results;
                        aEnc.forEach(function (encounter) {
                            var to_diag = encounter.to_Diagnosis.results; //table Data
                            to_diag.forEach(function (diagnosis) {
                                if (diagnosis.to_DiagType && diagnosis.to_DiagType.results.length > 0) {
                                    diagnosis.eTag = diagnosis.__metadata.etag;
                                    diagnosis.DiagSecondary = diagnosis.DiagSecondary === true ? 'S' : 'P';
                                    diagnosis.to_DiagType.results.forEach(function (diagType) {
                                        var type = diagType.DiagType;
                                        diagnosis[type] = diagType.DiagFlag
                                    });
                                }
                            });
                            //if (to_diag === "X") {

                            to_diag.push({});
                            //  }
                        });

                        this.getView().getModel("LimitsTemplateModel1").setData(oData1);

                        oModel_Data.read("/Patients('" + +  sPatientID +  "')/to_Diagnosis", {
                            urlParameters: {
                                $expand: "to_DiagType"
                            },
                            success: function (oData) {
                                sap.ui.core.BusyIndicator.hide();
                                that.bsyDialog.close();
                                var oTable = this.getView().byId("_IDGenTable2");
                                var oDiadata = LimitsTemplateModel.getData().DiagtypeDataChr
                                oDiadata.forEach(function (aDiatype) {
                                    if (!oColumn) {
                                        var oColumn = new sap.m.Column("colChrnic" + aDiatype.DiagType, {
                                            header: new sap.m.Label({
                                                text: aDiatype.DiagType,
                                                tooltip: aDiatype.DiagType_Text
                                                // template: oTemplate
                                            }),
                                            hAlign: "Initial",
                                            width: "5%"
                                        });
                                    }
                                    oTable.addColumn(oColumn);
                                    if (!oTemplate) {
                                        var oTemplate = oTable.getBindingInfo("items").template;
                                        oTemplate.addCell(new sap.m.CheckBox({
                                            id: "Chroniid_" + aDiatype.DiagType,
                                            selected: "{LimitsTabableModel>" + aDiatype.DiagType + "}",
                                            enabled: "{ConfigModel>/DiagEnab}"
                                        }));
                                    }
                                });
                                if (this.byId("btnEdit").getText() !== "edit header") {
                                    oTable.addColumn(
                                        new sap.m.Column({
                                            header: new sap.m.Label({
                                                text: ""
                                            }),
                                            hAlign: "Initial",
                                            width: "5%"
                                        })
                                    );
                                    var oTemplate = oTable.getBindingInfo("items").template;
                                    oTemplate.addCell(new sap.m.Button({
                                        press: this.onChrDiagDeletePress.bind(this),
                                        icon: "sap-icon://delete",
                                        type: "Reject"

                                    }));
                                }
                                var oModel1 = new sap.ui.model.json.JSONModel();
                                this.getView().setModel(oModel1, "LimitsTabableModel");

                                var aChroninDiag = oData.results;
                                // if (aChroninDiag === "X") {
                                aChroninDiag.push({});
                                //  }
                                aChroninDiag.forEach(function (ChroninDiag) {
                                    if (ChroninDiag && ChroninDiag.to_DiagType && ChroninDiag.to_DiagType.results.length > 0) {
                                        ChroninDiag.eTag = ChroninDiag.__metadata.etag;
                                        ChroninDiag.DiagSecondary = ChroninDiag.DiagSecondary === true ? 'S' : 'P';
                                        var to_diagtype = ChroninDiag.to_DiagType.results; //table Data
                                        to_diagtype.forEach(function (diagtype) {
                                            ChroninDiag[diagtype.DiagType] = diagtype.DiagFlag
                                        })
                                    }
                                });
                                this.getView().getModel("LimitsTabableModel").setData(oData.results);
                            }.bind(this),
                            error: function (oError) {
                                that.bsyDialog.close();
                                var msg = JSON.parse(oError.responseText).error.message.value;
                                sap.m.MessageToast.show(msg);
                            }
                        });
                    }.bind(this),
                    error: function (oError) {
                        that.bsyDialog.close();
                        var msg = JSON.parse(oError.responseText).error.message.value;
                        sap.m.MessageToast.show(msg);
                    }
                });

            },

            onEditDiag: function (evt) {
                this.getView().getModel("ConfigModel").setProperty("/DiagEnab", true);
                this.getView().getModel("ConfigModel").setProperty("/EditVisible", false);
                var aUrlParams = window.location.href.split("?");
                //var sCaseUUID = aUrlParams[1].split('&')[1].split('=')[1]
                if (!this.FirstTime) {
                    this.loadDataEdit(this.sContextPath)
                }
            },

            onDiagDeletePress: function (oEvent) {
                var aDeletedDiagnosisEntry = this.getView().getModel("DeletedDiagnosis").getData() || [];
                var object = oEvent.getSource().getParent().getBindingContext("LimitsTemplateModel1").getObject();
                object.Canceled = true;
                aDeletedDiagnosisEntry.push(object);
                this.getView().getModel("DeletedDiagnosis").setData(aDeletedDiagnosisEntry);
                sap.m.MessageToast.show(object.DiagCode + " " + "will be deleted");
                this.getView().getModel("LimitsTemplateModel1").refresh(true);

            },
            onChrDiagDeletePress: function (oEvent) {
                var aDeletedDiagnosisEntry = this.getView().getModel("ChronicDeletedDiagnosis").getData() || [];
                var object = oEvent.getSource().getParent().getBindingContext("LimitsTabableModel").getObject();
                object.Canceled = true;
                aDeletedDiagnosisEntry.push(object);
                this.getView().getModel("ChronicDeletedDiagnosis").setData(aDeletedDiagnosisEntry);
                sap.m.MessageToast.show(object.DiagCode + " " + "will be deleted");
                this.getView().getModel("LimitsTabableModel").refresh(true);

            },

            _handleDiagCodeVHSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var filter = new Filter({
                    filters: [
                        new Filter({
                            path: 'DiagCode',
                            operator: FilterOperator.Contains,
                            value1: sValue
                        }),
                        new Filter({
                            path: 'DiagCode_Text',
                            operator: FilterOperator.Contains,
                            value1: sValue
                        })
                    ],
                    and: false
                })
                var oBinding = oEvent.getParameter("itemsBinding");
                oBinding.filter([filter]);
            },
            _handleDiagCodeVHClose: function (oEvent) {
                var object = oEvent.getParameter("selectedItem").getBindingContext("DiagCodeVHModel")
                    .getObject();
                var aIndex = this._extractIndexes(this.sDiagCodeVHPath);
                if (!this.ChronicFlag) {
                    var aIndexContext = this._extractIndexes(this.sContextPath);
                    var oData = this.getView().getModel("LimitsTemplateModel1").getData();
                    var aDiagTableData = oData.to_Encounter.results[aIndexContext[0]].to_Diagnosis.results;
                        if (aDiagTableData.length === (aIndexContext[1] + 1)) {
                            aDiagTableData.push({});
                        };
                        this.getView().getModel("LimitsTemplateModel1").setData(oData);
                    this.oInputControl.setValueState("None")
                    var oData = this.getView().getModel("LimitsTemplateModel1").getData();
                    var aDiagTableRowData = oData.to_Encounter.results[aIndex[0]].to_Diagnosis.results[aIndex[1]];
                    aDiagTableRowData.DiagCatalog = object.DiagCatalog;
                    aDiagTableRowData.DiagCode = object.DiagCode;
                    aDiagTableRowData.DiagDesc = object.DiagCode_Text;
                    aDiagTableRowData.DiagCatalog_Text = object.DiagCatalog_Text;
                    this.getView().getModel("LimitsTemplateModel1").setData(oData);

                } else {
                    var aIndexContext = this._extractIndexes(this.sContextPath);
                    var oData = this.getView().getModel("LimitsTabableModel").getData();
                    var aDiagTableData = oData;
                    if (aDiagTableData.length === (aIndex[0] + 1)) {
                        aDiagTableData.push({});
                    };
                    this.getView().getModel("LimitsTabableModel").setData(oData);
                    var oData = this.getView().getModel("LimitsTabableModel").getData();
                    oData[aIndex[0]].DiagCatalog = object.DiagCatalog;
                    oData[aIndex[0]].DiagCatalog_Text = object.DiagCatalog_Text;
                    oData[aIndex[0]].DiagCode = object.DiagCode;
                    oData[aIndex[0]].DiagDesc = object.DiagCode_Text;
                    this.getView().getModel("LimitsTabableModel").setData(oData);
                }
            },
            _handleDiagCodeVHCancel: function () {
                this.oDiagCodeVHDialog.close();
            },

            onDiagCodeVHPress: function (oEvent) {
                this.ChronicFlag = false;
                this.sContextPath = oEvent.getSource().getParent().getBindingContextPath();
                var object = oEvent.getSource().getBindingContext("LimitsTemplateModel1").getObject();
                this.getDiagCodeVH(object.DiagCatalog);
                this.oInputControl = oEvent.getSource();
                if (!this.oDiagCodeVHDialog) {
                    this.oDiagCodeVHDialog = sap.ui.xmlfragment("project7.view.fragments.DiagCodeVH", this);
                    this.getView().addDependent(this.oDiagCodeVHDialog);
                }
                this.oDiagCodeVHDialog.open();
                this.sDiagCodeVHPath = oEvent.getSource().getBindingContext("LimitsTemplateModel1").getPath();
            },
            getDiagCodeVH: function (Catalog) {
                var oDiagCatModel = this.getView().getModel("DiagCodeVH")
                var that = this;
                if(Catalog) {
                var filter = new Filter('DiagCatalog', FilterOperator.EQ, Catalog || '');
                oDiagCatModel.read("/DiagnosisCodeValueHelp", {
                    filters: [filter],
                    success: function (oResponse) {
                        if (oResponse.results) {
                            // if (oResponse.results && oResponse.results.length > 0) {
                            that.getView().setModel(new JSONModel(oResponse.results), "DiagCodeVHModel");
                        }
                    }
                });
            } else {
                oDiagCatModel.read("/DiagnosisCodeValueHelp", {
                    urlParameters: {
                        "$top": 5000,
                       
                },
                    success: function (oResponse) {
                        if (oResponse.results) {
                            // if (oResponse.results && oResponse.results.length > 0) {
                            that.getView().setModel(new JSONModel(oResponse.results), "DiagCodeVHModel");
                        }
                    }
                });
            }
            },

            onDiagCodeChronicVHPress: function (oEvent) {
                this.sContextPath = oEvent.getSource().getParent().getBindingContextPath();
                var object = oEvent.getSource().getBindingContext("LimitsTabableModel").getObject();
                this.getDiagCodeVH(object.DiagCatalog);
                this.ChronicFlag = true;
                if (!this.oDiagCodeVHDialog) {
                    this.oDiagCodeVHDialog = sap.ui.xmlfragment("project7.view.fragments.DiagCodeVH", this);
                    this.getView().addDependent(this.oDiagCodeVHDialog);
                }
                this.oDiagCodeVHDialog.open();
                this.sDiagCodeVHPath = oEvent.getSource().getBindingContext("LimitsTabableModel").getPath();
            },
            onChangeLevel: function (oEvent) {
                this.getView().getModel("ConfigModel").setProperty("/DiagEnab", true);
                this.getView().getModel("ConfigModel").setProperty("/EditVisible", false);
            },
            onChangeDiagCode: function (oEvent) {
                var oSource = oEvent.getSource();
                oSource.setValueState("None");
                var code = oEvent.getParameter("newValue");
                var filter = new Filter('DiagCode', FilterOperator.EQ, code);
                var sContextPath = oEvent.getSource().getParent().getBindingContextPath();
                var aIndex = this._extractIndexes(sContextPath);
                var oModel = this.getView().getModel("LimitsTemplateModel1");
                this.getView().getModel("DiagCodeVH").read("/DiagnosisCodeValueHelp", {
                    filters: [filter],
                    success: function (oResponse) {
                        if (oResponse.results && oResponse.results.length > 0) {
                            var oData = oModel.getData();
                            var aDiagTableRowData = oData.to_Encounter.results[aIndex[0]].to_Diagnosis.results[aIndex[1]];
                            aDiagTableRowData.DiagCatalog = oResponse.results[0].DiagCatalog;
                            aDiagTableRowData.DiagCatalog_Text = oResponse.results[0].DiagCatalog_Text;
                            aDiagTableRowData.DiagCode = oResponse.results[0].DiagCode;
                            aDiagTableRowData.DiagDesc = oResponse.results[0].DiagCode_Text;
                            oModel.setData(oData);
                        } else {
                            oSource.setValueState("Error");
                        }
                    }
                });
            },
            onLiveChangeDiagCode: function (oEvent) {
                var oCode = oEvent.getParameter("newValue");
                if (oCode.length > 3) {
                    var object = oEvent.getSource().getBindingContext("LimitsTemplateModel1").getObject();
                    this._loadDiagCodeSuggestions(oCode, object.DiagCatalog);
                }
                if (oCode) {
                    var sContextPath = oEvent.getSource().getParent().getBindingContextPath();
                    var aIndex = this._extractIndexes(sContextPath);
                    var oData = this.getView().getModel("LimitsTemplateModel1").getData();
                    var aDiagTableData = oData.to_Encounter.results[aIndex[0]].to_Diagnosis.results;
                    if (aDiagTableData.length === (aIndex[1] + 1)) {
                        aDiagTableData.push({});
                    };
                    this.getView().getModel("LimitsTemplateModel1").setData(oData);
                }
            },
            _loadDiagCodeSuggestions: function (oCode, sCatalog) {
                var that = this;
                var oCodeFilter, oFilter;
                var oCodeFilter1 = new Filter('DiagCode', FilterOperator.Contains, oCode);
                var oCodeFilter2 = new Filter('DiagCode_Text', FilterOperator.Contains, oCode)
                oCodeFilter = new Filter({ filters: [oCodeFilter1, oCodeFilter2], and: false });
                if (sCatalog) {
                    var sCatalogFilter = new Filter("DiagCatalog", FilterOperator.EQ, sCatalog);
                    oFilter = new Filter({ filters: [oCodeFilter, sCatalogFilter], and: true });
                } else {
                    oFilter = oCodeFilter;
                }
                //var sPath = "/DiagnosisCodeValueHelp?$filter=DiagCode Contains '" + oCode + "'" + 'or' + "DiagCode_Text Contains '" + oCode + "'";
                this.getView().getModel("DiagCodeVH").read("/DiagnosisCodeValueHelp", {
                    filters: [oFilter],
                    success: function (oResponse) {
                        that.getView().setModel(new JSONModel(oResponse.results), "DiagCodeSuggestionModel");
                    }
                });
            },
            onLiveChangeChronicDiagCode: function (oEvent) {
                var oCode = oEvent.getParameter("newValue");
                if (oCode.length > 3) {
                    var object = oEvent.getSource().getBindingContext("LimitsTabableModel").getObject();
                    this._loadDiagCodeSuggestions(oCode, object.DiagCatalog);
                }
                if (oCode) {
                    var sContextPath = oEvent.getSource().getParent().getBindingContextPath();
                    var aIndex = this._extractIndexes(sContextPath);
                    var oData = this.getView().getModel("LimitsTabableModel").getData();
                    var aDiagTableData = oData;
                    if (aDiagTableData.length === (aIndex[0] + 1)) {
                        aDiagTableData.push({});
                    };
                    this.getView().getModel("LimitsTabableModel").setData(oData);
                }
            },
            _extractIndexes: function (path) {
                const parts = path.split('/');
                parts.shift();
                const indexes = [];
                parts.forEach(part => {
                    if (!isNaN(part)) {
                        indexes.push(Number(part));
                    }
                });
                return indexes;
            },
            handleRouteMatched: function (oEvent) {
                var PatientId=oEvent.getParameter("arguments").PatientID
                var caseId = oEvent.getParameter("arguments").CaseUUID
                this.sContextPath = caseId

               // var sPath = jQuery.sap.getModulePath("project7", "/model/Code.json");
              //  var oModel = new sap.ui.model.json.JSONModel(sPath);
                //  var sPathHeaderItem =new sap.ui.model.json.JSONModel(jQuery.sap.getModulePath());
               // this.getView().setModel(oModel, "sPathHeaderItemModel");
                this._LoadData(PatientId,caseId);
                this._loadVHData();
                // this.EncounterData();
                // this.PatientsData();
                // this.DiagnosisData();
            },
            onChangingCatalog: function (oEvent) {
                var newval = oEvent.getParameter("newValue");
                var key = oEvent.getSource().getSelectedItem();
                if (newval !== "" && key === null) {
                    oEvent.getSource().setValue("");
                    oEvent.getSource().setValueState("Error");
                } else {
                    oEvent.getSource().setValueState("None");
                }

            },

            onPressCancel: function() {
                var aUrlParams = window.location.href.split("?");
                //var sCaseUUID = aUrlParams[1].split('&')[1].split('=')[1]
                // this.oApproveDialog.destroy();
                this.getView().getModel("DeletedDiagnosis").setData([]);
                this.getView().getModel("ChronicDeletedDiagnosis").setData([]);
                this.getView().getModel("ConfigModel").setProperty("/DiagEnab", false);
                this.getView().getModel("ConfigModel").setProperty("/EditVisible", true);
                this.loadDataEdit(this.sContextPath);
            },

            onPressSaveConfirmation: function () {
                
                var that = this;
                that.strt ="";
                var sDiagCode;
                var sTextforPopup;
                var aDeletedDiagnosisEntry = this.getView().getModel("DeletedDiagnosis").getData();
                var aDeleteChronicdDiagnosisEntry = this.getView().getModel("ChronicDeletedDiagnosis").getData();
                var oChronicData = this.getView().getModel("LimitsTabableModel").getData();
                var oDiagTypeData = this.getView().getModel("DiagTypeConfigModelChr").getData();
                var sDiagTy;
                var aTempDiagtype = [];
                oChronicData.forEach(function (chrData) {
                    if((chrData.DiagStart === undefined && chrData.DiagCode != null) || (chrData.DiagStart === null && chrData.DiagCatalog)){
                        that.strt = "X";
                        MessageBox.error("Start date is mandatory");
                        return;
                    }
                });
             
                oChronicData.forEach(function (chronicData) {
                    
                    oDiagTypeData.forEach(function (diagTy) {
                        sDiagTy = diagTy.DiagType
                        if (chronicData[sDiagTy]) {
                            aTempDiagtype.push(chronicData[sDiagTy])
                        } else {
                        }
                    });
                });
                var iDelChr = aDeleteChronicdDiagnosisEntry.length || 0;
                if (oChronicData[0].DiagCode === undefined  || (aTempDiagtype && aTempDiagtype.length > 0 && (oChronicData.length - 1 - iDelChr) <= aTempDiagtype.length && that.strt !== "X")) {
                    if (aDeletedDiagnosisEntry.length === 0 && aDeleteChronicdDiagnosisEntry.length === 0) {
                        sTextforPopup = "Are you sure you want to save?";
                    } else {
                        if(aDeletedDiagnosisEntry.length > 0){
                            aDeletedDiagnosisEntry.forEach(function (DeletedEntry) {
                                if (sDiagCode) {
                                    sDiagCode = sDiagCode + ", " + DeletedEntry.DiagCode
                                }
                                else {
                                    sDiagCode = DeletedEntry.DiagCode;
                                }
                        

                            });
                        }   
                        if (aDeleteChronicdDiagnosisEntry.length > 0) {
                            aDeleteChronicdDiagnosisEntry.forEach(function (ChrDeletedEntry) {
                                if (sDiagCode) {
                                    sDiagCode = sDiagCode + ", " + ChrDeletedEntry.DiagCode
                                }
                                else {
                                    sDiagCode = ChrDeletedEntry.DiagCode;
                                }
                        

                            });

                        }
                        sTextforPopup = "Diagnosis Entries with these code " + sDiagCode + " would be deleted, Confirm?"
                    }
                    if (!this.oApproveDialog) {

                        this.oApproveDialog = new Dialog({
                            type: DialogType.Message,
                            title: "Confirm",
                            content: new Text({ text: sTextforPopup }),
                            beginButton: new Button({
                                type: ButtonType.Emphasized,
                                text: "Submit",
                                press: function () {
                                    this.oApproveDialog.close();
                                    this.onPressSave();
                                }.bind(this)

                                // this.onPressSave().bind(this)
                            }),
                            endButton: new Button({
                                text: "Cancel",
                                press: function () {
                                    this.oApproveDialog.close();
                                    this.resetDialog();
                                }.bind(this)
                            })
                        });
                    }
                    this.oApproveDialog.open();
                } else {
                    if (!this.oValidationDiag && that.strt !=="X") {
                        this.oValidationDiag = new Dialog({
                            type: DialogType.Message,
                            title: "Confirm",
                            content: new Text({ text: "Select Atleast one Diagnosis type in Chronic section" }),
                            beginButton: new Button({
                                type: ButtonType.Emphasized,
                                text: "Ok",
                                press: function () {
                                    this.oValidationDiag.close();
                                }.bind(this)

                            })
                        });
                    }
                    this.oValidationDiag.open();
                }
            },

            resetDialog:function(){
                this.oApproveDialog.destroy();
                this.oApproveDialog = null;
            },
            onPressSave: function (oevt) {
                sap.ui.core.BusyIndicator.show();
                this.resetDialog();
                this.FirstTime = false;
                // this.bsyDialog.open();
                var sEtag = this.sETag
                var oModel = this.getOwnerComponent().getModel("CUDModel");
                //var oModel2 = new sap.ui.model.odata.ODataModel(oModel.sServiceUrl, true);
                var oLimitsData = this.getView().getModel("LimitsTemplateModel1").getData();
                var sOrg = oLimitsData.Org;
                var oEncounters = this.getView().getModel("LimitsTemplateModel1").getData().to_Encounter.results;
                var oPayload = [];
                oModel.setUseBatch(true);
                oModel.setDeferredGroups(["BatchCall"]);
                var that = this;
                oEncounters.forEach(function (encounter) {
                    var aDiagnosis = encounter.to_Diagnosis.results;
                    var sEncounterUUID = encounter.EncounterUUID
                    aDiagnosis.forEach(function (oDiagnosis) {
                        var aDiagType = [];
                        if (oDiagnosis && oDiagnosis.to_DiagType && oDiagnosis.to_DiagType.results) {
                            oDiagnosis.to_DiagType.results.forEach(function (diagType) {
                                aDiagType.push({
                                    "DiagType": diagType.DiagType,
                                    "DiagFlag": oDiagnosis[diagType.DiagType],
                                    "CreatedBy": "",
                                    "CreatedAt": null,
                                    "LocalLastChangedUser": "",
                                    "LocalLastChangedAt": null,
                                    "Canceled": false,
                                    "DiagTypeUuid": diagType.DiagTypeUuid,
                                    "DiagUuid": diagType.DiagUuid
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
                                "Org": sOrg,
                                "DiagCatalog": oDiagnosis.DiagCatalog,
                                "DiagCode": oDiagnosis.DiagCode,
                                "DiagDesc": oDiagnosis.DiagDesc,
                                "DiagLevel": oDiagnosis.DiagLevel,
                                "DiagUUID": oDiagnosis.DiagUUID,
                                "EncounterUUID": sEncUUID,
                                "PatientId": oDiagnosis.PatientId,
                                "DiagSecondary": oDiagnosis.DiagSecondary === 'S' ? true : false,
                                "DiagLat": oDiagnosis.DiagLat,
                                "DiagCert": oDiagnosis.DiagCert,
                                "DiagStart": oDiagnosis.DiagStart,
                                "DiagEnd": oDiagnosis.DiagEnd,
                                "Canceled": oDiagnosis.Canceled,
                                "to_DiagType": aDiagType,
                                "eTag": oDiagnosis.eTag
                            });
                        }
                    });
                })

                oPayload.forEach(function (payloadbatch) {
                    if(!payloadbatch.Canceled){
                        var payloadforCreate = {
                            "Org": payloadbatch.Org,
                            "DiagCatalog": payloadbatch.DiagCatalog,
                            "DiagCode": payloadbatch.DiagCode,
                            "DiagDesc": payloadbatch.DiagDesc,
                            "DiagLevel": payloadbatch.DiagLevel,
                            "DiagUUID": payloadbatch.DiagUUID,
                            "EncounterUUID": payloadbatch.EncounterUUID,
                            "PatientId": payloadbatch.PatientId,
                            "DiagSecondary": payloadbatch.DiagSecondary,
                            "DiagLat": payloadbatch.DiagLat,
                            "DiagCert": payloadbatch.DiagCert,
                            "DiagStart": payloadbatch.DiagStart,
                            "DiagEnd": payloadbatch.DiagEnd,
                            "Canceled": payloadbatch.Canceled,
                            "to_DiagType": payloadbatch.to_DiagType
                        };
                    }
                    if (payloadbatch.Canceled && payloadbatch.DiagUUID) {
                        oModel.callFunction("/Cancel", {
                            groupId: "BatchCall",
                            eTag: '*',
                            method: "POST",
                            urlParameters: {
                                "DiagUUID": payloadbatch.DiagUUID
                            }
                        });
                    }
                    if (!payloadbatch.DiagUUID) {
                        if(!payloadbatch.Canceled){
                            oModel.create("/DiagnosisSet", payloadforCreate, {
                                groupId: "BatchCall"
                            });
                        }
                    } else {
                        var payloadforPut = {
                            "Org": payloadbatch.Org,
                            "DiagCatalog": payloadbatch.DiagCatalog,
                            "DiagCode": payloadbatch.DiagCode,
                            "DiagDesc": payloadbatch.DiagDesc,
                            "DiagLevel": payloadbatch.DiagLevel,
                            "DiagUUID": payloadbatch.DiagUUID,
                            "EncounterUUID": payloadbatch.EncounterUUID,
                            "PatientId": payloadbatch.PatientId,
                            "DiagSecondary": payloadbatch.DiagSecondary,
                            "DiagLat": payloadbatch.DiagLat,
                            "DiagCert": payloadbatch.DiagCert,
                            "DiagStart": payloadbatch.DiagStart,
                            "DiagEnd": payloadbatch.DiagEnd,
                            "Canceled": payloadbatch.Canceled,
                        };
                        var oPayloadDiagType = [];
                        oPayloadDiagType.push(payloadbatch.to_DiagType)

                        oModel.update("/DiagnosisSet(guid'" + payloadbatch.DiagUUID + "')", payloadforPut, {
                            groupId: "BatchCall",
                            eTag: payloadbatch.eTag
                        });
                        var eTagType = payloadbatch.eTag
                        oPayloadDiagType[0].forEach(function (diagtypepayload) {
                            if (diagtypepayload.DiagTypeUuid) {
                                oModel.update("/DiagnosisTypes(guid'" + diagtypepayload.DiagTypeUuid + "')",
                                    diagtypepayload, {
                                    groupId: "BatchCall",
                                    eTag: eTagType
                                })
                            }
                        })
                    }
                });


                //preparing Chronic Payload

                var oChronicData = this.getView().getModel("LimitsTabableModel").getData()
                var oPayloadChronic = []
                oChronicData.forEach(function (chronicData) {
                    var aDiagTypeChr = []
                    if (chronicData && chronicData.to_DiagType && chronicData.to_DiagType.results) {
                        chronicData.to_DiagType.results.forEach(function (diagType) {
                            aDiagTypeChr.push({
                                "DiagType": diagType.DiagType,
                                "DiagFlag": chronicData[diagType.DiagType],
                                "CreatedBy": "",
                                "CreatedAt": null,
                                "LocalLastChangedUser": "",
                                "LocalLastChangedAt": null,
                                "Canceled": false,
                                "DiagTypeUuid": diagType.DiagTypeUuid,
                                "DiagUuid": diagType.DiagUuid
                            });
                        });
                    } else {
                        var aDiagosisType = that.getView().getModel("DiagTypeConfigModelChr").getData();
                        aDiagosisType.forEach(function (diagType) {
                            aDiagTypeChr.push({
                                "DiagType": diagType.DiagType,
                                "DiagFlag": chronicData[diagType.DiagType],
                                "CreatedBy": "",
                                "CreatedAt": null,
                                "LocalLastChangedUser": "",
                                "LocalLastChangedAt": null,
                                "Canceled": false
                            });
                        });
                    }

                    if (chronicData.DiagCatalog && chronicData.DiagCode) {
                        oPayloadChronic.push({
                            "Org": sOrg,
                            "DiagCatalog": chronicData.DiagCatalog,
                            "DiagCode": chronicData.DiagCode,
                            "DiagDesc": chronicData.DiagDesc,
                            "DiagLevel": chronicData.DiagLevel,
                            "DiagUUID": chronicData.DiagUUID,
                            "PatientId": chronicData.PatientId,
                            "DiagSecondary": chronicData.DiagSecondary === 'S' ? true : false,
                            "DiagLat": chronicData.DiagLat,
                            "DiagCert": chronicData.DiagCert,
                            "DiagStart": chronicData.DiagStart,
                            "DiagEnd": chronicData.DiagEnd,
                            "Canceled": chronicData.Canceled,
                            "to_DiagType": aDiagTypeChr,
                            "eTag": chronicData.eTag
                        });
                    }
                });

                oPayloadChronic.forEach(function (payloadchr) {
                    if(!payloadchr.Canceled){
                        var payloadChronicreate = {
                            "Org": payloadchr.Org,
                            "DiagCatalog": payloadchr.DiagCatalog,
                            "DiagCode": payloadchr.DiagCode,
                            "DiagDesc": payloadchr.DiagDesc,
                            "DiagLevel": payloadchr.DiagLevel,
                            "DiagUUID": payloadchr.DiagUUID,
                            "PatientId": payloadchr.PatientId,
                            "DiagSecondary": payloadchr.DiagSecondary,
                            "DiagLat": payloadchr.DiagLat,
                            "DiagCert": payloadchr.DiagCert,
                            "DiagStart": payloadchr.DiagStart,
                            "DiagEnd": payloadchr.DiagEnd,
                            "Canceled": payloadchr.Canceled,
                            "to_DiagType": payloadchr.to_DiagType
                        }
                    }
                    if (payloadchr.Canceled && payloadchr.DiagUUID) {
                        oModel.callFunction("/Cancel", {
                            groupId: "BatchCall",
                            eTag: '*',
                            method: "POST",
                            urlParameters: {
                                "DiagUUID": payloadchr.DiagUUID
                            }
                        });
                    }

                    if (!payloadchr.DiagUUID) {
                        if(!payloadchr.Canceled){
                            oModel.create("/DiagnosisSet", payloadChronicreate, {
                                groupId: "BatchCall"
                            });
                        }
                    } else {
                        var payloadChronicUpd = {
                            "Org": payloadchr.Org,
                            "DiagCatalog": payloadchr.DiagCatalog,
                            "DiagCode": payloadchr.DiagCode,
                            "DiagDesc": payloadchr.DiagDesc,
                            "DiagUUID": payloadchr.DiagUUID,
                            "PatientId": payloadchr.PatientId,
                            "DiagSecondary": payloadchr.DiagSecondary,
                            "DiagLat": payloadchr.DiagLat,
                            "DiagCert": payloadchr.DiagCert,
                            "DiagStart": payloadchr.DiagStart,
                            "DiagEnd": payloadchr.DiagEnd,
                            "Canceled": payloadchr.Canceled,
                        };
                        var oPayloadDiagType = [];
                        oPayloadDiagType.push(payloadchr.to_DiagType)

                        oModel.update("/DiagnosisSet(guid'" + payloadchr.DiagUUID + "')", payloadChronicUpd, {
                            groupId: "BatchCall",
                            eTag: payloadchr.eTag
                        });
                        var eTagType = payloadchr.eTag
                        oPayloadDiagType[0].forEach(function (diagtypepayload) {
                            if (diagtypepayload.DiagTypeUuid) {
                                oModel.update("/DiagnosisTypes(guid'" + diagtypepayload.DiagTypeUuid + "')",
                                    diagtypepayload, {
                                    groupId: "BatchCall",
                                    eTag: eTagType
                                })
                            }
                        })
                    }

                });
                oModel.submitChanges({
                    groupId: "BatchCall",
                    success: function (oData, oResponse) {
                        if (oResponse) {
                            debugger;
                        }
                        //MessageToast.show("Data Saved")
                        sap.ui.core.BusyIndicator.hide();
                        that.getView().getModel("ConfigModel").setProperty("/DiagEnab", false);
                        that.getView().getModel("ConfigModel").setProperty("/EditVisible", true);
                        that.getView().getModel("DeletedDiagnosis").setData([]);
                        that.getView().getModel("ChronicDeletedDiagnosis").setData([]);
                        //window.location.reload();
                    },
                    error: function (oError) {
                        MessageToast.show("Error is saving Data")
                    }
                });
            }
        });
    });
