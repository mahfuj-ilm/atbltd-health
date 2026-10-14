import { render, screen, fireEvent } from '@testing-library/react';
import BackgroundGlow from '../BackgroundGlow';
import CTAButton from '../CTAButton';
import SectionHeading from '../SectionHeading';
import ChairmanMessage from '../ChairmanMessage';
import AboutChairman from '../AboutChairman';
import Benefits from '../Benefits';
import BenefitEligibility from '../BenefitEligibility';
import ClaimWorkflow from '../ClaimWorkflow';
import DiseaseCoverage from '../DiseaseCoverage';
import FAQ from '../FAQ';
import Footer from '../Footer';
import HeroVideo from '../HeroVideo';
import HeroStats from '../HeroStats';
import Hero from '../Hero';
import HowItWorks from '../HowItWorks';
import MembershipDetails from '../MembershipDetails';
import { en } from '../../i18n/en';

describe('Landing Components', () => {
  describe('BackgroundGlow', () => {
    it('renders ambient glow elements', () => {
      const { container } = render(<BackgroundGlow />);
      expect(container.querySelectorAll('.glow-red').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('.glow-blue').length).toBeGreaterThan(0);
    });
  });

  describe('CTAButton', () => {
    it('renders primary button and responds to click', () => {
      const onClick = jest.fn();
      render(<CTAButton onClick={onClick}>Get Started</CTAButton>);

      const button = screen.getByRole('button', { name: /get started/i });
      expect(button).toHaveClass('primary-button');
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders secondary button variant', () => {
      render(<CTAButton secondary>Learn More</CTAButton>);
      const button = screen.getByRole('button', { name: /learn more/i });
      expect(button).toHaveClass('secondary-button');
    });
  });

  describe('SectionHeading', () => {
    it('renders eyebrow, title, and description', () => {
      render(
        <SectionHeading
          eyebrow="Our Story"
          title="Building Trust"
          description="A comprehensive healthcare platform."
          centered
        />
      );

      expect(screen.getByText('Our Story')).toBeInTheDocument();
      expect(screen.getByText('Building Trust')).toBeInTheDocument();
      expect(screen.getByText('A comprehensive healthcare platform.')).toBeInTheDocument();
    });
  });

  describe('ChairmanMessage', () => {
    it('renders the chairman message and author credentials', () => {
      render(<ChairmanMessage strings={en.chairman} />);

      expect(screen.getByText(en.chairman.eyebrow)).toBeInTheDocument();
      expect(screen.getByText(en.chairman.title)).toBeInTheDocument();
      expect(screen.getByText(en.chairman.body1)).toBeInTheDocument();
      expect(screen.getAllByText(en.chairman.name).length).toBeGreaterThan(0);
    });
  });

  describe('AboutChairman', () => {
    it('renders chairman career and educational details', () => {
      render(<AboutChairman strings={en.aboutChairman} />);

      expect(screen.getByText(en.aboutChairman.eyebrow)).toBeInTheDocument();
      expect(screen.getByText(en.aboutChairman.currentRoles)).toBeInTheDocument();
      expect(screen.getByText(en.aboutChairman.roles.chairman)).toBeInTheDocument();
    });
  });

  describe('Benefits', () => {
    it('renders benefit sections and bullet points', () => {
      render(<Benefits strings={en.benefits} />);

      expect(screen.getAllByText(en.benefits.title)[0]).toBeInTheDocument();
      expect(screen.getByText(en.benefits.meaningfulCoverTitle)).toBeInTheDocument();
      expect(screen.getByText(en.benefits.meaningfulPoints[0])).toBeInTheDocument();
    });
  });

  describe('BenefitEligibility', () => {
    it('renders eligibility criteria and rules', () => {
      render(<BenefitEligibility strings={en.eligibility} />);

      expect(screen.getByText(en.eligibility.title)).toBeInTheDocument();
      expect(screen.getByText(en.eligibility.rule1Title)).toBeInTheDocument();
      expect(screen.getByText(en.eligibility.rule1Copy)).toBeInTheDocument();
    });
  });

  describe('ClaimWorkflow', () => {
    it('renders workflow steps and details', () => {
      render(<ClaimWorkflow strings={en.claimWorkflow} />);

      expect(screen.getByText(en.claimWorkflow.title)).toBeInTheDocument();
      expect(screen.getByText(en.claimWorkflow.steps[0].title)).toBeInTheDocument();
      expect(screen.getByText(en.claimWorkflow.steps[0].activity[0])).toBeInTheDocument();
    });
  });

  describe('DiseaseCoverage', () => {
    it('renders covered and excluded disease lists', () => {
      render(<DiseaseCoverage strings={en.diseaseCoverage} />);

      expect(screen.getByText(en.diseaseCoverage.title)).toBeInTheDocument();
      expect(screen.getByText(en.diseaseCoverage.coveredHeading)).toBeInTheDocument();
      expect(screen.getByText(en.diseaseCoverage.coveredList[0])).toBeInTheDocument();
      expect(screen.getByText(en.diseaseCoverage.notCoveredHeading)).toBeInTheDocument();
      expect(screen.getByText(en.diseaseCoverage.notCoveredList[0])).toBeInTheDocument();
    });
  });

  describe('FAQ', () => {
    it('renders FAQ questions and toggles answers on click', () => {
      render(<FAQ strings={en.faq} />);

      expect(screen.getByText(en.faq.title)).toBeInTheDocument();

      const firstQuestion = screen.getByText(en.faq.questions.q1);
      expect(firstQuestion).toBeInTheDocument();
      expect(screen.getByText(en.faq.answers.q1)).toBeInTheDocument();

      // Click second question to open it
      const secondQuestion = screen.getByText(en.faq.questions.q2);
      fireEvent.click(secondQuestion);
      expect(screen.getByText(en.faq.answers.q2)).toBeInTheDocument();

      // Click second question again to collapse it
      fireEvent.click(secondQuestion);
    });
  });

  describe('Footer', () => {
    it('renders footer brand, links, and contact information', () => {
      render(<Footer strings={en.footer} />);

      expect(screen.getByText(en.footer.intro)).toBeInTheDocument();
      expect(screen.getByText(en.footer.explore)).toBeInTheDocument();
      expect(screen.getByText(en.footer.support)).toBeInTheDocument();
      expect(screen.getByText(en.footer.getInTouch)).toBeInTheDocument();
      expect(screen.getByText(en.footer.address)).toBeInTheDocument();
    });
  });

  describe('HeroVideo', () => {
    it('renders background video and handles playback rotation', () => {
      const { container } = render(<HeroVideo />);
      const videos = container.querySelectorAll('video');
      expect(videos.length).toBeGreaterThan(0);

      // Trigger video onEnded to advance video index
      fireEvent.ended(videos[0]);
    });
  });

  describe('HeroStats', () => {
    it('renders stats metrics', () => {
      render(<HeroStats strings={{ stats: en.stats }} />);

      expect(screen.getByText(en.stats.maximumCoverage)).toBeInTheDocument();
      expect(screen.getByText(en.stats.hospitalStay)).toBeInTheDocument();
      expect(screen.getByText(en.stats.monthsValidity)).toBeInTheDocument();
    });
  });

  describe('Hero', () => {
    it('renders hero title and triggers join callback', () => {
      const onJoin = jest.fn();
      render(<Hero strings={en.hero} statsStrings={en.stats} onJoin={onJoin} />);

      expect(screen.getByText(en.hero.kicker)).toBeInTheDocument();
      expect(screen.getByText(en.hero.title)).toBeInTheDocument();
      expect(screen.getByText(en.hero.titleTwo)).toBeInTheDocument();

      const joinButton = screen.getByRole('button', { name: en.hero.becomeMember });
      fireEvent.click(joinButton);
      expect(onJoin).toHaveBeenCalledTimes(1);
    });
  });

  describe('HowItWorks', () => {
    it('renders process steps', () => {
      render(<HowItWorks strings={en.howItWorks} />);

      expect(screen.getByText(en.howItWorks.title)).toBeInTheDocument();
      expect(screen.getByText(en.howItWorks.step1)).toBeInTheDocument();
      expect(screen.getByText(en.howItWorks.step1Desc)).toBeInTheDocument();
    });
  });

  describe('MembershipDetails', () => {
    it('renders membership details and key values', () => {
      render(<MembershipDetails strings={en.membership} />);

      expect(screen.getByText(en.membership.title)).toBeInTheDocument();
      expect(screen.getByText(en.membership.annualMembership)).toBeInTheDocument();
      expect(screen.getByText(en.membership.annualMembershipValue)).toBeInTheDocument();
    });
  });
});
