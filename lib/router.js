Router.configure({
  layoutTemplate: 'layout',
  loadingTemplate: 'loading',
  waitOn: function() { 
    return [Meteor.subscribe('notifications')];
  }
});
PostsListController = RouteController.extend({
  template: 'postsList',
  increment: 5, 
  limit: function() { 
    return parseInt(this.params.postsLimit) || this.increment; 
  },
  findOptions: function() {
    return {sort: this.sort, limit: this.limit()};
  },
  waitOn: function() {
    return Meteor.subscribe('posts', this.findOptions());
  },
  posts: function() {
    return Posts.find({}, this.findOptions());
  },
  data: function() {
    var hasMore = this.posts().count() === this.limit();
    return {
      posts: this.posts(),
      nextPath: hasMore ? this.nextPath() : null
    };
  }
});
NewPostsListController = PostsListController.extend({
  sort: {submitted: -1, _id: -1},
  nextPath: function() {
    return Router.routes.newPosts.path({postsLimit: this.limit() + this.increment})
  }
});
BestPostsListController = PostsListController.extend({
  sort: {votes: -1, submitted: -1, _id: -1},
  nextPath: function() {
    return Router.routes.bestPosts.path({postsLimit: this.limit() + this.increment})
  }
});
ClickedPostsListController = PostsListController.extend({
  sort: {clicks: -1, submitted: -1, _id: -1},
  nextPath: function() {
    return Router.routes.clickedPosts.path({postsLimit: this.limit() + this.increment})
  }
});
Router.map(function() {
  this.route('home', {
    path: '/',
    controller: NewPostsListController
  });
  this.route('newPosts', {
    path: '/new/:postsLimit?',
    controller: NewPostsListController
  });
  this.route('bestPosts', {
    path: '/best/:postsLimit?',
    controller: BestPostsListController
  });
  this.route('clickedPosts', {
    path: '/clicked/:postsLimit?',
    controller: ClickedPostsListController
  });
  this.route('postPage', {
    path: '/posts/:_id',
    waitOn: function() {
      return [
        Meteor.subscribe('singlePost', this.params._id),
        Meteor.subscribe('comments', this.params._id)
      ];
    },
    data: function() { return Posts.findOne(this.params._id); }
  });
  this.route('postEdit', {
    path: '/posts/:_id/edit',
    waitOn: function() { 
      return Meteor.subscribe('singlePost', this.params._id);
    },
    data: function() { return Posts.findOne(this.params._id); }
  });
  this.route('postSubmit', {
    path: '/submit',
    disableProgress: true
  });
  this.route('rss', {
    where: 'server',
    path: '/feed.xml',
    action: function() {
      var feed = new RSS({
        title: "New Microscope Posts",
        description: "The latest posts from Microscope, the smallest news aggregator."
      });
      Posts.find({}, {sort: {submitted: -1}, limit: 20}).forEach(function(post) {
        feed.item({
          title: post.title,
          description: post.body,
          author: post.author,
          date: post.submitted,
          url: '/posts/' + post._id
        })
      });
      this.response.write(feed.xml());
      this.response.end();
    }
  });
  this.route('apiPosts', {
    where: 'server',
    path: '/api/posts',
    action: function() {
      var parameters = this.request.query,
          limit = !!parameters.limit ? parameters.limit : 20,
          data = Posts.find({}, {limit: limit, fields: {title: 1, author: 1, url: 1, submitted: 1}}).fetch();
      this.response.write(JSON.stringify(data));
      this.response.end();
    }
  });
  this.route('apiPost', {
    where: 'server',
    path: '/api/posts/:_id',
    action: function() {
      var post = Posts.findOne(this.params._id);
      if(post){
        this.response.write(JSON.stringify(post));
      } else {
        this.response.writeHead(404, {'Content-Type': 'text/html'});
        this.response.write("Post not found.");
      }
      this.response.end();
    }
  });
});
var requireLogin = function(pause) {
  if (! Meteor.user()) {
    if (Meteor.loggingIn())
      this.render(this.loadingTemplate);
    else
      this.render('accessDenied');
    pause();
  }
}

if(Meteor.isClient){
  Router.onBeforeAction('loading');
  Router.onBeforeAction(requireLogin, {only: 'postSubmit'});
  Router.onBeforeAction(function() { Errors.clearSeen(); });
}