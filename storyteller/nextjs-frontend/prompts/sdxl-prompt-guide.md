# SDXL Prompt Engineering Guide for Biblical Content

This guide provides specific strategies for crafting prompts that work effectively with Stable Diffusion XL 1.0 on Amazon Bedrock for biblical narrative imagery with Nigerian cultural elements.

## SDXL Prompt Structure

SDXL responds best to prompts with a particular structure:

```
[Subject description], [Setting/scene], [Lighting], [Artistic style], [Quality enhancers]
```

### Example Structure:
```
A respected teacher sharing wisdom with followers, in a Nigerian community gathering space, morning sunlight streaming through windows, detailed digital art, professional photography style, highly detailed, sharp focus
```

## Effective Techniques for Biblical Content

### 1. Artistic Framing
Frame biblical content as artistic interpretations or historical scenes:

```
A historical scene depicting a wise teacher sharing bread with followers in a Nigerian Yoruba setting, inspired by classical religious paintings, warm lighting
```

### 2. Style References
SDXL responds well to specific artistic style references:

```
In the style of [Nigerian artist], historical narrative painting, classical composition, renaissance lighting, detailed illustration
```

### 3. Emphasis on Cultural Elements
Lead with cultural context to improve generation quality:

```
Nigerian cultural scene with traditional Igbo elements including [specific details], showing a historical teaching moment, photorealistic, detailed
```

### 4. Quality Boosters
Add these terms to enhance image quality:

```
professional photography, 8k, highly detailed, sharp focus, intricate details, realistic lighting, cinematic, art by master artists
```

## Nigerian-Specific SDXL Prompt Patterns

### Character Portraits:
```
Portrait of a [character description] in traditional Nigerian [region] attire, [emotion] expression, detailed cultural elements including [specific details], photorealistic, detailed face, professional photography, soft natural lighting
```

### Teaching Scenes:
```
Historical teaching scene in a Nigerian [setting], a respected elder sharing wisdom with attentive listeners, [time of day] light, detailed expressions, cultural elements including [specific details], inspired by classical religious art, highly detailed digital painting
```

### Narrative Moments:
```
A powerful moment showing [scene description] set in contemporary Nigeria with [cultural elements], emotional impact, dramatic lighting, cinematic composition, highly detailed illustration in the style of Nigerian artists
```

## Parameter Recommendations for SDXL

| Parameter | Recommended Value | Notes |
|-----------|------------------|-------|
| CFG Scale | 7.0-8.0 | Higher values for better prompt adherence |
| Steps | 30-50 | More steps for complex religious scenes |
| Sampler | K_DPMPP_2M | Good balance of detail and speed |
| Size | 1024x1024 | Standard for SDXL |
| Negative Prompt | See below | Customize based on output issues |

### Recommended Negative Prompt:
```
blurry, distorted, low quality, cartoon, deformed faces, unrealistic features, poor anatomy, bad proportions, watermark, signature, oversaturated, text, writing
```

## Testing and Iteration Strategy

1. **Start Simple**: Begin with simplified descriptions of biblical scenes
2. **Add Detail Gradually**: Add more specific elements as you confirm what works
3. **A/B Testing**: Systematically test variations of prompts to identify patterns
4. **Document Success**: Create a library of successful prompt patterns

## Example SDXL-Optimized Biblical Prompts

### Original (Potentially Flagged):
```
Jesus preaching the Sermon on the Mount to his disciples and followers
```

### SDXL-Optimized:
```
Historical scene of a wise teacher sharing important wisdom on a hillside, surrounded by attentive followers in contemporary Nigerian clothing with subtle traditional patterns, golden afternoon sunlight, soft clouds, inspirational moment, detailed digital art in the style of Nigerian narrative paintings, professional photography, highly detailed
```

### Original (Potentially Flagged):
```
Jesus healing the blind man with his disciples watching in amazement
```

### SDXL-Optimized:
```
Powerful moment of transformation as a respected healer helps a vision-impaired person, set in a contemporary Nigerian community space with observers showing expressions of wonder and hope, warm emotional scene, morning light streaming through windows, detailed illustration inspired by classical art, photorealistic, highly detailed
```

## Implementation Notes

- Spend time optimizing a few key prompts before scaling to full library
- Create template variants for different types of biblical scenes
- Document which approaches work best for specific biblical narratives
- Update this guide as you discover more effective patterns
