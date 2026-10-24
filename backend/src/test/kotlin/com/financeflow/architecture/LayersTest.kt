package com.financeflow.architecture

import com.tngtech.archunit.base.DescribedPredicate.not
import com.tngtech.archunit.core.domain.JavaClass.Predicates.assignableTo
import com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage
import com.tngtech.archunit.core.domain.properties.CanBeAnnotated.Predicates.annotatedWith
import com.tngtech.archunit.core.importer.ClassFileImporter
import com.tngtech.archunit.core.importer.ImportOption
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses
import jakarta.persistence.Entity
import org.junit.jupiter.api.Test
import org.springframework.data.repository.Repository

/** Direção das dependências entre as camadas de cada módulo (ADR-0028, ADR-0034). */
class LayersTest {

    private val classes = ClassFileImporter()
        .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
        .importPackages("com.financeflow")

    @Test
    fun `domain não depende de Spring, JPA nem das outras camadas`() {
        noClasses().that().resideInAPackage("com.financeflow.*.domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "org.springframework..",
                "jakarta.persistence..",
                "com.financeflow.*.application..",
                "com.financeflow.*.infra..",
                "com.financeflow.*.api..",
            )
            .check(classes)
    }

    @Test
    fun `api não enxerga infra`() {
        noClasses().that().resideInAPackage("com.financeflow.*.api..")
            .should().dependOnClassesThat().resideInAPackage("com.financeflow.*.infra..")
            .check(classes)
    }

    @Test
    fun `application usa de infra só entidades e repositórios`() {
        val adapter = resideInAPackage("com.financeflow.*.infra..")
            .and(not(annotatedWith(Entity::class.java)))
            .and(not(assignableTo(Repository::class.java)))
        noClasses().that().resideInAPackage("com.financeflow.*.application..")
            .should().dependOnClassesThat(adapter)
            .check(classes)
    }

    @Test
    fun `nenhuma camada depende de api`() {
        noClasses().that().resideInAnyPackage(
            "com.financeflow.*.domain..",
            "com.financeflow.*.application..",
            "com.financeflow.*.infra..",
        )
            .should().dependOnClassesThat().resideInAPackage("com.financeflow.*.api..")
            .check(classes)
    }
}
