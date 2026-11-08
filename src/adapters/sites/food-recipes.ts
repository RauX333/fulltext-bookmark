import { defineArticle } from '../define'
import type { SiteAdapter } from '../types'
export const foodRecipesAdapters: SiteAdapter[] = [
  defineArticle({
    id: 'douguo-recipe',
    hosts: ['douguo.com'],
    content: ['#left .metarial, #left .step, #left .tips']
  }),
  defineArticle({
    id: 'goodfood-recipe',
    hosts: ['bbcgoodfood.com'],
    content: ['#recipe-masthead-description, .recipe__instructions']
  }),
  defineArticle({
    id: 'delish-recipe',
    hosts: ['delish.com'],
    content: ['.recipe-body']
  }),
  defineArticle({
    id: 'bonappetit-article',
    hosts: ['bonappetit.com'],
    content: ['.article__body'],
    ignore: ['[class*="Recirc"], [class*="Newsletter"]']
  }),
  defineArticle({
    id: 'downshiftology-recipe',
    revision: 3,
    stopBefore: [{ selector: 'p', text: /^Other recipes you might like:$/ }],
    hosts: ['downshiftology.com'],
    content: ['article.type-recipes .entry-content'],
    ignore: [
      '.wprm-recipe-buttons-container',
      '.post-summary',
      '.newsletter',
      '.sharedaddy',
      '.social-share'
    ]
  }),
  defineArticle({
    id: 'food52-article',
    hosts: ['food52.com'],
    content: ['article .RichText']
  }),
  defineArticle({
    id: 'pinchofyum-recipe',
    revision: 3,
    stopBefore: [
      { selector: 'h2', text: /^More Favorite Taco Recipes To Love$/ }
    ],
    hosts: ['pinchofyum.com'],
    content: ['.entry-content'],
    ignore: [
      '.sharedaddy',
      '.wprm-recipe-buttons-container',
      '#comments',
      '.comment-respond',
      '.related-posts',
      '.related-recipes'
    ]
  }),
  defineArticle({
    id: 'cookingclassy-recipe',
    hosts: ['cookingclassy.com'],
    content: ['article.singlepost > .content']
  }),
  defineArticle({
    id: 'skinnytaste-recipe',
    revision: 5,
    hosts: ['skinnytaste.com'],
    content: ['.entry-content'],
    ignore: [
      '.wprm-recipe-buttons-container',
      '.post-summary',
      '#comments',
      '.comment-respond',
      '.wprm-footer',
      '.wprm-recipe-last-step',
      '.dpsp-content-wrapper',
      '.google-trusted-source'
    ]
  }),
  defineArticle({
    id: 'minimalistbaker-recipe',
    hosts: ['minimalistbaker.com'],
    content: ['.entry-content'],
    ignore: [
      '#comments',
      '.comment-respond',
      '.sharedaddy',
      '.wprm-recipe-buttons-container',
      '.related-posts'
    ]
  }),
  defineArticle({
    id: 'smittenkitchen-recipe',
    hosts: ['smittenkitchen.com'],
    content: ['.entry-content'],
    ignore: ['.sharedaddy', '.jp-relatedposts']
  }),
  defineArticle({
    id: 'loveandlemons-recipe',
    hosts: ['loveandlemons.com'],
    content: ['.entry-content-single']
  })
]
