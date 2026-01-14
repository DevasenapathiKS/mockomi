import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BriefcaseIcon,
  UserGroupIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { PublicLayout } from '@/components/layout';
import Button from '@/components/ui/Button';

const features = [
  {
    icon: BriefcaseIcon,
    title: 'Find Your Dream Job',
    description: 'Browse thousands of job listings from top companies and find the perfect role for you.',
  },
  {
    icon: VideoCameraIcon,
    title: 'Mock Interviews',
    description: 'Practice with experienced interviewers and get detailed feedback to improve your skills.',
  },
  {
    icon: UserGroupIcon,
    title: 'Connect with Employers',
    description: 'Get discovered by employers actively looking for candidates like you.',
  },
];

const stats = [
  { value: '10,000+', label: 'Active Jobs' },
  { value: '5,000+', label: 'Companies' },
  { value: '50,000+', label: 'Job Seekers' },
  { value: '95%', label: 'Success Rate' },
];

const benefits = [
  '2 free mock interviews for every job seeker',
  'Video recording of interview sessions',
  'Detailed feedback and improvement tips',
  'Connect with industry experts',
  'Practice for specific roles and companies',
  'Affordable pricing at just ₹100 per session',
];

const HomePage: React.FC = () => {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-700 text-white">
        <div className="absolute inset-0 bg-grid-white/10 bg-grid-16" />
        <div className="container-custom py-24 lg:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-medium backdrop-blur-sm mb-6">
                <SparklesIcon className="h-4 w-4" />
                Your career success starts here
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Land Your Dream Job with
                <span className="block text-yellow-300">Mock Interviews</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto">
                Practice interviews with industry experts, get personalized feedback, and boost your
                confidence to ace your next interview.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-gray-100"
                  rightIcon={<ArrowRightIcon className="h-5 w-5" />}
                >
                  <Link to="/register">Get Started Free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <Link to="/jobs">Browse Jobs</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-b">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-bold text-primary-600">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50">
        <div className="container-custom">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From job search to interview preparation, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-soft-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mock Interview Benefits */}
      <section className="py-24 bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Ace your interviews with confidence
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Our mock interview system connects you with experienced professionals who provide
                real-world interview experience and actionable feedback.
              </p>

              <ul className="mt-8 space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10">
                <Button size="lg" rightIcon={<ArrowRightIcon className="h-5 w-5" />}>
                  <Link to="/register">Start Practicing</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-8 lg:p-12">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <VideoCameraIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Mock Interview Session</h4>
                      <p className="text-sm text-gray-500">Technical Interview - 45 mins</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Overall Rating</span>
                      <span className="font-medium text-gray-900">4.5/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Communication</span>
                      <span className="font-medium text-gray-900">4/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Problem Solving</span>
                      <span className="font-medium text-gray-900">5/5</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Feedback:</strong> Great problem-solving approach! Work on explaining
                      your thought process more clearly.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Ready to take your career to the next level?
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Join thousands of job seekers who have already improved their interview skills and
              landed their dream jobs.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Link to="/register">Create Free Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <Link to="/about">Learn More</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default HomePage;
