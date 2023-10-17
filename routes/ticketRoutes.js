const express = require('express')
const router = express.Router()
const ticketController = require('../controllers/ticketController')

router.route('/')
    .get(ticketController.getAllTickets)
    // .post(ticketController.createNewStructure)
    // .patch(ticketController.updateStructure)
    // .delete(ticketController.deleteStructure)

module.exports = router