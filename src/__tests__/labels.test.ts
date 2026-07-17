import {
  TAG_CATEGORY_LABEL,
  TAG_CATEGORY_ORDER,
  TAG_CATEGORY_HINT,
} from '@/lib/labels'
import { tagCategoryEnum } from '@/lib/schemas'

const CATEGORIES = tagCategoryEnum.options

describe('tag category labels', () => {
  it('every schema category has a label, hint, and a place in the order', () => {
    for (const cat of CATEGORIES) {
      expect(TAG_CATEGORY_LABEL[cat]).toBeTruthy()
      expect(TAG_CATEGORY_HINT[cat]).toBeTruthy()
      expect(TAG_CATEGORY_ORDER).toContain(cat)
    }
  })

  it('the order lists each category exactly once and nothing extra', () => {
    expect([...TAG_CATEGORY_ORDER].sort()).toEqual([...CATEGORIES].sort())
    expect(new Set(TAG_CATEGORY_ORDER).size).toBe(TAG_CATEGORY_ORDER.length)
  })
})
