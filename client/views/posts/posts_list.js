Template.postsList.helpers({
  postsWithRank: function() {
    if(!this.posts)
      return;
    this.posts.rewind();
    return this.posts.map(function(post, index, cursor) {
      post._rank = index;
      return post;
    });
  }
});