import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Sample data for seeding
const usersData = [
  {
    name: 'John Doe',
    username: 'johndoe',
    email: 'john.doe@example.com',
    phone: '+1-555-0123',
    website: 'https://johndoe.dev',
    address: {
      street: '123 Main St',
      suite: 'Apt 4B',
      city: 'New York',
      zipcode: '10001',
      geo: { lat: '40.7128', lng: '-74.0060' },
    },
    company: {
      name: 'Tech Solutions Inc',
      catchPhrase: 'Innovating the future',
      bs: 'harness real-time e-markets',
    },
  },
  {
    name: 'Jane Smith',
    username: 'janesmith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0124',
    website: 'https://janesmith.com',
    address: {
      street: '456 Oak Ave',
      suite: 'Suite 200',
      city: 'Los Angeles',
      zipcode: '90210',
      geo: { lat: '34.0522', lng: '-118.2437' },
    },
    company: {
      name: 'Creative Design Studio',
      catchPhrase: 'Designing beautiful experiences',
      bs: 'integrate cutting-edge solutions',
    },
  },
  {
    name: 'Mike Johnson',
    username: 'mikejohnson',
    email: 'mike.johnson@example.com',
    phone: '+1-555-0125',
    website: 'https://mikejohnson.io',
    address: {
      street: '789 Pine Rd',
      suite: 'Unit 15',
      city: 'Chicago',
      zipcode: '60601',
      geo: { lat: '41.8781', lng: '-87.6298' },
    },
    company: {
      name: 'Digital Innovations',
      catchPhrase: 'Building tomorrow today',
      bs: 'leverage agile frameworks',
    },
  },
  {
    name: 'Sarah Wilson',
    username: 'sarahwilson',
    email: 'sarah.wilson@example.com',
    phone: '+1-555-0126',
    website: 'https://sarahwilson.dev',
    address: {
      street: '321 Elm St',
      suite: 'Apt 7C',
      city: 'Houston',
      zipcode: '77001',
      geo: { lat: '29.7604', lng: '-95.3698' },
    },
    company: {
      name: 'Future Systems',
      catchPhrase: 'Empowering digital transformation',
      bs: 'revolutionize scalable platforms',
    },
  },
  {
    name: 'David Brown',
    username: 'davidbrown',
    email: 'david.brown@example.com',
    phone: '+1-555-0127',
    website: 'https://davidbrown.tech',
    address: {
      street: '654 Maple Dr',
      suite: 'Office 300',
      city: 'Phoenix',
      zipcode: '85001',
      geo: { lat: '33.4484', lng: '-112.0740' },
    },
    company: {
      name: 'Cloud Solutions',
      catchPhrase: 'Scalable cloud infrastructure',
      bs: 'optimize virtual architectures',
    },
  },
  {
    name: 'Emily Davis',
    username: 'emilydavis',
    email: 'emily.davis@example.com',
    phone: '+1-555-0128',
    website: 'https://emilydavis.com',
    address: {
      street: '987 Cedar Ln',
      suite: 'Suite 500',
      city: 'Philadelphia',
      zipcode: '19101',
      geo: { lat: '39.9526', lng: '-75.1652' },
    },
    company: {
      name: 'Data Analytics Pro',
      catchPhrase: 'Turning data into insights',
      bs: 'implement robust analytics',
    },
  },
  {
    name: 'Chris Miller',
    username: 'chrismiller',
    email: 'chris.miller@example.com',
    phone: '+1-555-0129',
    website: 'https://chrismiller.dev',
    address: {
      street: '147 Birch Ave',
      suite: 'Apt 12D',
      city: 'San Antonio',
      zipcode: '78201',
      geo: { lat: '29.4241', lng: '-98.4936' },
    },
    company: {
      name: 'Mobile First',
      catchPhrase: 'Mobile-first development',
      bs: 'deploy cross-platform solutions',
    },
  },
  {
    name: 'Lisa Garcia',
    username: 'lisagarcia',
    email: 'lisa.garcia@example.com',
    phone: '+1-555-0130',
    website: 'https://lisagarcia.io',
    address: {
      street: '258 Spruce St',
      suite: 'Unit 8',
      city: 'San Diego',
      zipcode: '92101',
      geo: { lat: '32.7157', lng: '-117.1611' },
    },
    company: {
      name: 'UX Excellence',
      catchPhrase: 'Creating amazing user experiences',
      bs: 'deliver intuitive interfaces',
    },
  },
  {
    name: 'Tom Anderson',
    username: 'tomanderson',
    email: 'tom.anderson@example.com',
    phone: '+1-555-0131',
    website: 'https://tomanderson.tech',
    address: {
      street: '369 Willow Rd',
      suite: 'Office 150',
      city: 'Dallas',
      zipcode: '75201',
      geo: { lat: '32.7767', lng: '-96.7970' },
    },
    company: {
      name: 'Security Solutions',
      catchPhrase: 'Protecting digital assets',
      bs: 'secure enterprise networks',
    },
  },
  {
    name: 'Rachel Lee',
    username: 'rachellee',
    email: 'rachel.lee@example.com',
    phone: '+1-555-0132',
    website: 'https://rachellee.com',
    address: {
      street: '741 Poplar Dr',
      suite: 'Apt 22E',
      city: 'San Jose',
      zipcode: '95101',
      geo: { lat: '37.3382', lng: '-121.8863' },
    },
    company: {
      name: 'AI Innovations',
      catchPhrase: 'Intelligent automation',
      bs: 'harness machine learning',
    },
  },
];

const generatePosts = (userId: number) => {
  const postTitles = [
    'Getting Started with Modern Web Development',
    'The Future of Artificial Intelligence',
    'Building Scalable Microservices',
    'Design Patterns in Software Engineering',
    'Optimizing Database Performance',
    'Security Best Practices for Web Applications',
    'Cloud Computing Trends in 2024',
    'Mobile App Development Strategies',
    'DevOps and Continuous Integration',
    'User Experience Design Principles',
  ];

  return postTitles.map((title) => ({
    title,
    body: `This is a comprehensive article about ${title.toLowerCase()}. It covers various aspects including best practices, common pitfalls, and real-world examples. The content is designed to be both educational and practical for developers at all levels.`,
    userId,
  }));
};

const generateComments = (postId: number) => {
  const commentData = [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      body: 'Great article! This really helped me understand the concepts better.',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      body: 'Thanks for sharing this valuable information. Looking forward to more posts!',
    },
    {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      body: 'I have a question about the implementation. Could you elaborate on the database optimization part?',
    },
    {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      body: 'This is exactly what I was looking for. The examples are very clear and practical.',
    },
    {
      name: 'David Brown',
      email: 'david.brown@example.com',
      body: 'Excellent write-up! The step-by-step approach makes it easy to follow along.',
    },
  ];

  return commentData.map((comment) => ({
    ...comment,
    postId,
  }));
};

const generateTodos = (userId: number) => {
  const todoData = [
    {
      title: 'Review pull requests',
      description: 'Review and provide feedback on pending pull requests from team members',
    },
    {
      title: 'Update documentation',
      description: 'Update API documentation and README files with latest changes',
    },
    {
      title: 'Fix bug in authentication module',
      description: 'Investigate and fix the reported authentication issue in the login system',
    },
    {
      title: 'Write unit tests',
      description: 'Add comprehensive unit tests for the new user management features',
    },
    {
      title: 'Deploy to staging environment',
      description: 'Deploy the latest changes to the staging environment for testing',
    },
    {
      title: 'Code review for team members',
      description: 'Conduct thorough code reviews for the latest feature implementations',
    },
    {
      title: 'Update dependencies',
      description: 'Update npm packages and resolve any security vulnerabilities',
    },
    {
      title: 'Optimize database queries',
      description: 'Analyze and optimize slow database queries for better performance',
    },
    {
      title: 'Implement new feature',
      description: 'Implement the user notification system as per the requirements',
    },
    {
      title: 'Refactor legacy code',
      description: 'Refactor the old payment processing module to use modern patterns',
    },
    {
      title: 'Set up monitoring alerts',
      description: 'Configure monitoring alerts for system health and performance metrics',
    },
    {
      title: 'Create API documentation',
      description: 'Generate comprehensive API documentation using OpenAPI/Swagger',
    },
    {
      title: 'Fix security vulnerabilities',
      description: 'Address security issues identified in the latest security audit',
    },
    {
      title: 'Performance testing',
      description: 'Conduct load testing to ensure the system can handle expected traffic',
    },
    {
      title: 'User acceptance testing',
      description: 'Coordinate with stakeholders for user acceptance testing of new features',
    },
    {
      title: 'Backup database',
      description: 'Create a full backup of the production database before major updates',
    },
    {
      title: 'Update SSL certificates',
      description: 'Renew and update SSL certificates for all production domains',
    },
    {
      title: 'Monitor system logs',
      description: 'Monitor application logs for any errors or performance issues',
    },
    {
      title: 'Plan next sprint',
      description: 'Plan and prioritize tasks for the upcoming development sprint',
    },
    {
      title: 'Attend team meeting',
      description: 'Participate in the weekly team meeting to discuss progress and blockers',
    },
  ];

  return todoData.map((todo) => ({
    title: todo.title,
    description: todo.description,
    completed: Math.random() > 0.6, // 40% chance of being completed
    userId,
  }));
};

export const seedDatabase = async () => {
  try {
    logger.info('Starting database seeding...');

    // Clear existing data
    await prisma.comment.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // Reset auto-increment sequences to start from 1
    await prisma.$executeRaw`ALTER SEQUENCE users_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE posts_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE todos_id_seq RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE comments_id_seq RESTART WITH 1`;

    logger.info('Existing data cleared and sequences reset to start from 1');

    // Create users
    const users = await Promise.all(
      usersData.map(userData => prisma.user.create({ data: userData }))
    );

    logger.info(`Created ${users.length} users`);

    // Create posts for each user
    const posts = [];
    for (const user of users) {
      const userPosts = generatePosts(user.id);
      const createdPosts = await Promise.all(
        userPosts.map(postData => prisma.post.create({ data: postData }))
      );
      posts.push(...createdPosts);
    }

    logger.info(`Created ${posts.length} posts`);

    // Create todos for each user
    const todos = [];
    for (const user of users) {
      const userTodos = generateTodos(user.id);
      const createdTodos = await Promise.all(
        userTodos.map(todoData => prisma.todo.create({ data: todoData }))
      );
      todos.push(...createdTodos);
    }

    logger.info(`Created ${todos.length} todos`);

    // Create comments for each post
    const comments = [];
    for (const post of posts) {
      const postComments = generateComments(post.id);
      const createdComments = await Promise.all(
        postComments.map(commentData => prisma.comment.create({ data: commentData }))
      );
      comments.push(...createdComments);
    }

    logger.info(`Created ${comments.length} comments`);

    logger.info('Database seeding completed successfully!');
    logger.info(`Summary: ${users.length} users, ${posts.length} posts, ${todos.length} todos, ${comments.length} comments`);

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding failed:', error);
      process.exit(1);
    });
} 