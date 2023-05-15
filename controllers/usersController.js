const User = require('../model/User')

const getAllUsers = async (req, res) => {
    const allUsers = await User.find()
    if (!allUsers) return res.status(204).json({ 'msg': 'NO CONTENT: No users found' })
    res.json(allUsers)
}

const deleteUser = async (req, res) => {
    if (!req?.body?.id) return res.status(400).json({ "msg": 'BAD REQUEST: User ID required' })
    const thisUser = await User.findOne({ _id: req.body.id }).exec()

    if (!thisUser) return res.status(204).json({ 'msg': `NO CONTENT: User ID ${req.body.id} not found` })
    const result = await thisUser.deleteOne({ _id: req.body.id })
    
    res.json(result)
}

const getSingleUser = async (req, res) => {
    if (!req?.params?.id) return res.status(400).json({ "msg": 'BAD REQUEST: User ID required' })
    const thisUser = await User.findOne({ _id: req.params.id }).exec()

    if (!thisUser) return res.status(204).json({ 'msg': `NO CONTENT: User ID ${req.params.id} not found` })
    
    res.json(thisUser)
}

module.exports = {
    getAllUsers,
    deleteUser,
    getSingleUser
}