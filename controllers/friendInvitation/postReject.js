const FriendInvitation = require("../../models/friendInvitation");
const friendsUpdates = require("../../socketHandlers/updates/friends");

const postReject = async (req, res) => {
  console.log("uzywampostReject");
  try {
    const { senderId, receiverId } = req.body;
    const { _id } = req.user;
    console.log("id", req.body);
    console.log("_id", _id);

    // remove that invitation from friend invitations collection
    const invitation = await FriendInvitation.findOne({
      senderId: senderId,
      receiverId: receiverId,
    });
    if (!invitation) {
      return res.status(401).send("Error occured. Please try again");
    }

    await FriendInvitation.findByIdAndDelete(invitation._id);

    // update pending invitations
    friendsUpdates.updateFriendsPendingInvitations(receiverId.toString());

    return res.status(200).send("Invitation succesfully rejected");
  } catch (err) {
    console.log(err);
    return res.status(500).send("Something went wrong please try again");
  }
};

module.exports = postReject;
