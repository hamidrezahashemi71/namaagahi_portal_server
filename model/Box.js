const mongoose = require('mongoose')
const moment = require('moment-jalaali');
const Schema = mongoose.Schema

const boxSchema = new Schema({
        boxId: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        name: {
            type: String,
            required: true
        },
        mark: {
            name: {
                type: String,
                required: true  
            },
            markOptions: {
                projectNumber: {
                    type: String,
                    required: false
                },
                brand: {
                    type: String,
                    required: false
                }
            }
        },
        duration:{
            startDate: {
                type: Number,
                required: true
            },
            endDate: {
                type: Number,
                required: true
            },
            diff: {
                type: Number,
                required: false,
                default: function() {
                    return  (moment((new Date(this.duration.endDate).toISOString().substring(0, 10)), 'jYYYY-jMM-jDD').diff
                    (moment((new Date(this.duration.startDate).toISOString().substring(0, 10)), 'jYYYY-jMM-jDD'), 'days')) + 1
                }
            }
        }, 
        structures: [{
            structureId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'Structure'
            },
            duration: {
                startDate: {
                    type: Number,
                    required: true,
                    default: function() {
                        return this.parent().duration.startDate
                    }
                },
                endDate: {
                    type: Number,
                    required: true,
                    default: function() {
                        return this.parent().duration.endDate
                    }
                },
                diff: {
                    type: Number,
                    required: false,
                }
            },
            marks: {
                name: {
                    type: String,
                    required: true  
                },
                markOptions: {
                    style: {
                        type: String,
                        required: true
                    },
                    face: {
                        type: String,
                        required: true
                    },
                    length: {
                        type: Number,
                        required: true
                    }, 
                    width: {
                        type: Number,
                        required: true
                    }, 
                    printSize: {
                        type: Number,
                        required: true
                    },
                    docSize: {
                        type: Number,
                        required: true
                    }
                }
            },
            costs: {
                fixedCosts: {
                    squareCost: {
                        type: Number,
                        required: true
                    },
                    monthlyCost: {
                        type: Number,
                        required: false,
                        default: function() {
                            console.log(this)
                            return this.marks.markOptions.docSize * this.costs.fixedCosts.squareCost
                        }
                    },
                    dailyCost: {
                        type: Number,
                        required: false,
                        default: function() {
                            return this.costs.fixedCosts.monthlyCost / 30
                        }
                    },
                    periodCost: {
                        type: Number,
                        required: false,
                    },
                },
                variableCosts: [{
                    name: {
                        type: String,
                        required: true
                    },
                    figures: {
                        monthlyCost: {
                            type: Number,
                            required: true
                        },
                        periodCost: {
                            type: Number,
                            required: false,

                        },
                        dailyCost: {
                            type: Number,
                            required: false,
                            default: function() {
                                return this.figures.monthlyCost / 30
                            }
                        }
                    }
                }],
                dailyVariableCost: {
                    type: Number,
                    required: true,
                    default: function() {
                        return this.costs.variableCosts.reduce((acc, curr) => {
                            return acc + curr.figures.dailyCost
                          }, 0)
                    }
                },
                totalDailyCost: {
                    type: Number,
                    required: true,
                    default: function() {
                        return this.costs.fixedCosts.dailyCost + this.costs.dailyVariableCost
                    }
                },
                totalMonthlyCost: {
                    type: Number,
                    required: true,
                    default: function() {
                        return (this.costs.totalDailyCost) * 30
                    }
                },
                totalPeriodCost: {
                    type: Number,
                    required: true,
                    default: function() {
                        const diff = this.parent().duration.diff ?? 0
                        return this.costs.totalDailyCost * diff
                    }
                }
            },
            monthlyBaseFee: {
                type: Number,
                required: true
            }
        }]
    } 
,
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON: { virtuals: true }
    }
) 

boxSchema.virtual('structures.structureDurationDiff').get(function() {
    return this.structures.map(structure => {
        return moment((new Date(structure.duration.endDate).toISOString().substring(0, 10)), 'jYYYY-jMM-jDD').diff
        (moment((new Date(structure.duration.startDate).toISOString().substring(0, 10)), 'jYYYY-jMM-jDD'), 'days') + 1
    })
})

boxSchema.virtual('structures.structureFixedPeriodCost').get(function() {
    return this.structures.map(structure => {
        return (structure.costs.fixedCosts.monthlyCost / 30) * structure.duration.diff
    })
})

boxSchema.virtual('dailyVariableCost').get(function() {
    return this.costs.variableCosts.reduce((acc, curr) => {
      return acc + curr.figures.dailyCost;
    }, 0)
  })
  
boxSchema.virtual('totalDailyCost').get(function() {
return this.costs.fixedCosts.dailyCost + this.dailyVariableCost
})

boxSchema.virtual('totalMonthlyCost').get(function() {
return this.totalDailyCost * 30
})

boxSchema.virtual('totalPeriodCost').get(function() {
const diff = this.parent().duration.diff ?? 0
return this.totalDailyCost * diff
})

boxSchema.pre('save', function(next) {
    const doc = this

    if (doc.isNew || doc.isModified('duration')) {
        const diff = moment((new Date(doc.duration.endDate).toISOString().substring(0, 10)), 'jYYYY-jMM-jDD').diff
        (moment((new Date(doc.duration.startDate).toISOString().substring(0, 10)), 'jYYYY-jMM-jDD'), 'days') + 1
        doc.duration.diff = diff
    }

    doc.structures.forEach((structure) => {
        if (
            structure.isModified('costs.fixedCosts.squareCost') ||
            structure.isModified('marks.markOptions.docSize') ||
            structure.isModified('duration.startDate') || 
            structure.isModified('duration.endDate')
            ) {
            const structureDiff = moment((new Date(structure.duration.endDate).toISOString().substring(0, 10)), 'jYYYY-jMM-jDD').diff
            (moment((new Date(structure.duration.startDate).toISOString().substring(0, 10)), 'jYYYY-jMM-jDD'), 'days') + 1
            structure.duration.diff = structureDiff
            structure.costs.fixedCosts.monthlyCost = structure.marks.markOptions.docSize * structure.costs.fixedCosts.squareCost;
            structure.costs.fixedCosts.dailyCost = structure.costs.fixedCosts.monthlyCost / 30
            structure.costs.fixedCosts.periodCost = (structure.costs.fixedCosts.monthlyCost / 30) * structure.duration.diff
        }
      })

    let dailyVariableCost = 0
    doc.structures.forEach((structure) => {
        structure.costs.variableCosts.forEach((variableCost) => {
        dailyVariableCost += variableCost.figures?.dailyCost || 0
        })
        structure.costs.dailyVariableCost = dailyVariableCost;
        structure.costs.totalDailyCost = (structure.costs.fixedCosts.dailyCost || 0) + dailyVariableCost
        structure.costs.totalMonthlyCost = structure.costs.totalDailyCost * 30
        structure.costs.totalPeriodCost = structure.costs.totalDailyCost * structure.duration.diff
    })

    doc.structures.forEach((structure) => {
        if (structure.costs.variableCosts && structure.costs.variableCosts.length > 0) {
            structure.costs.variableCosts.forEach((variableCost) => {
                if (variableCost.figures.monthlyCost) {
                    const monthlyCost = variableCost.figures.monthlyCost;
                    const durationDiff = structure.duration.diff;

                    const periodCost = (monthlyCost / 30) * durationDiff;
                    variableCost.figures.periodCost = periodCost;

                    const dailyCost = monthlyCost / 30;
                    variableCost.figures.dailyCost = dailyCost;
                }
            })
        }
    })

    next()
})

module.exports = mongoose.model('Box', boxSchema)