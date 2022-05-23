// zehan logic    
followUser: async ( req, res, next ) => {
        try {
            const username = req.params.username;
            const userToFollow = await User.findOne( { username } );
            //* user not found
            if ( !userToFollow ) {
                res.status( 400 ).json( { error: "User not found" } )
            } 
            //* user to follow found
            if ( userToFollow ) {
                const userFollwingList = await User.findById(req.users.userId);
                //* user already following 
                if (  userFollwingList.following.some((v)=>String(v) === String(userToFollow._id)) ) {
                    return res.status( 400 ).json( { error: "you already follow this user" } )
                } 
                //* user and following are not same
                if ( req.users.userId != userToFollow._id ) {
                    const user = await User.findByIdAndUpdate( req.users.userId, { $push: { following: userToFollow._id } }, { new: true } );
                    await User.findByIdAndUpdate( userToFollow._id, { $push: { followers: req.users.userId } }, { new: true }  )
                    res.status( 200 ).json( { msg:`${user.username} follow ${userToFollow.username}`, profile: {
                        email: user.email,
                        bio: user.bio,
                        image: user.image,
                        following: user.following
                    }  } )
                } 
                //* user and following user same
                if ( req.users.userId == userToFollow._id ) {
                    res.status( 400 ).json( { error: "you can't follow yourself" } )
                }
            }
        } catch (error) {
            return next(error)
        }
    },

    unfollowUser: async ( req, res, next ) => {
        try {
            const username = req.params.username;
            const userToUnfollow = await User.findOne( { username } );
            //* user not found
            if ( !userToUnfollow ) {
                res.status( 400 ).json( { error: "User not found" } )
            } 
            //* user and unfollowing user same
            if ( req.users.userId == userToUnfollow._id ) {
                res.status( 400 ).json( { error: "you can't unfollow yourself" } )
            }
            if ( userToUnfollow ) {
                if ( req.users.userId != userToUnfollow._id ) {
                    const user = await User.findByIdAndUpdate( req.users.userId, { $pull: { following: userToUnfollow._id } }, { new: true } );
                    await User.findByIdAndUpdate( userToUnfollow._id, { $pull: { followers: req.users.userId } } )
                    res.status( 200 ).json( { msg:`${user.username} unfollow ${userToUnfollow.username}`, proflie: {
                        email: user.email,
                        bio: user.bio,
                        image: user.image,
                        following: user.following
                    }  } )
                }
                if ( req.users.userId == userToUnfollow._id ) {
                    res.status( 400 ).json( { error: "you can't follow yourself" } )
                }
            } 
        } catch (error) {
            return next ( error );
        }
    }

// fisrt logic
router.post('/:username/follow', auth.isLoggedIn, async (req, res, next) => {
  let username = req.params.username;
  loggedUser = req.user;
  try {
    let targetProfile = await Profile.findOne({ username });
    if (!targetProfile) {
      return res.json({ error: 'invalid profile username' });
    }

    if (username === loggedUser.username) {
      return res.json({ error: 'you can not follow yourself' });
    }
    let currentUser = await Profile.findOneAndUpdate(
      {
        username: loggedUser.username,
      },
      { $push: { following: targetProfile.id } }
    );

    let updatedTarget = await Profile.findByIdAndUpdate(targetProfile.id, {
      $push: { followers: currentUser.id },
    });

    return res.json({ loggedUser: currentUser, followedUser: updatedTarget });
  } catch (error) {
    next(error);
  }
});

//unfollow profile

router.delete('/:username/follow', auth.isLoggedIn, async (req, res, next) => {
  let username = req.params.username;
  loggedUser = req.user;
  try {
    let targetProfile = await Profile.findOne({ username });
    if (!targetProfile) {
      return res.json({ error: 'invalid profile username' });
    }

    if (username === loggedUser.username) {
      return res.json({ error: 'you can not unfollow/follow yourself' });
    }
    let currentUser = await Profile.findOneAndUpdate(
      {
        username: loggedUser.username,
      },
      { $pull: { following: targetProfile.id } }
    );

    let updatedTarget = await Profile.findByIdAndUpdate(targetProfile.id, {
      $pull: { followers: currentUser.id },
    });

    return res.json({ loggedUser: currentUser, followedUser: updatedTarget });
  } catch (error) {
    next(error);
  }
});

// second logic
router.post('/:username/follow', async (req, res, next) => {
  let username = req.params.username;
  try {
    let user1 = await User.findOne({ username });
    if (!user1) {
      return res
        .status(400)
        .json({ errors: ['There is no user with that name'] });
    }
    let user2 = await User.findById(req.user.userId);
    if (
      user1.username != user2.username &&
      !user2.followingList.includes(user1.id)
    ) {
      user2 = await User.findByIdAndUpdate(user2.id, {
        $push: { followingList: user1.id },
      });
      user1 = await User.findByIdAndUpdate(user1.id, {
        $push: { followersList: user2.id },
      });
      return res.status(201).json({ user: user1.displayUser(user2.id) });
    } else {
      return res
        .status(400)
        .json({ errors: { body: ['You are already following the person'] } });
    }
  } catch (error) {
    next(error);
  }
});

//Unfollow user
router.delete('/:username/follow', async (req, res, next) => {
  let username = req.params.username;
  try {
    let user1 = await User.findOne({ username });
    if (!user1) {
      return res
        .status(400)
        .json({ errors: ['There is no user with that name'] });
    }
    let user2 = await User.findById(req.user.userId);
    if (user2.followingList.includes(user1.id)) {
      user2 = await User.findByIdAndUpdate(user2.id, {
        $pull: { followingList: user1.id },
      });
      user1 = await User.findByIdAndUpdate(user1.id, {
        $pull: { followersList: user2.id },
      });
      return res.status(200).json({ user: user1.displayUser(user2.id) });
    } else {
      return res
        .status(400)
        .json({ errors: { body: ['You are not following this person'] } });
    }
  } catch (error) {
    next(error);
  }
});

//3
router.post("/:username/follow", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      const currentUser = await User.findById(req.body.user.userId);
      if (!currentUser.following.includes(user._id)) {
        currentUser.following.push(user._id);
        user.follower.push(currentUser._id);
        var update = await currentUser.save();
        var updateUser = await user.save();
        res.json({
          user: createProfile(updateUser, update),
        });
      } else {
        res.json({
          user: createProfile(updateUser, update),
        });
      }
    } else {
      res.status(400).json({ error: "invalid-02" });
    }
  } catch (error) {
    res.status(200).send(error);
  }
});

router.delete("/:username/follow", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (user) {
      const currentUser = await User.findById(req.body.user.userId);
      if (currentUser.following.includes(user._id)) {
        currentUser.following.pull(user._id);
        user.follower.pull(currentUser._id);
        var update = await currentUser.save();
        var updateUser = await user.save();
        res.json({
          user: createProfile(updateUser, update),
        });
      } else {
        res.json({
          user: createProfile(updateUser, update),
        });
      }
    } else {
      throw new Error("invalid-02");
    }
  } catch (error) {
    res.status(400).send(error);
  }
});

function createProfile(user, currentUser) {
  const isFollowing = currentUser.following.includes(user._id);
  return {
    username: currentUser.username,
    bio: currentUser.bio,
    image: currentUser.image,
    following: isFollowing,
  };
}
